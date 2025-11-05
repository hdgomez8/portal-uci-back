const models = require('../../models');
const CambioTurno = models.CambioTurno;
const Empleado = models.Empleado;
const EmpleadoArea = models.EmpleadoArea;
const Area = models.Area;
const Departamento = models.Departamento;
const { sendMail } = require('../../utils/mailer');
const db = require('../../config/database');

// Crear nueva solicitud de cambio de turno
exports.crearCambioTurno = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO crearCambioTurno ---');
    console.log('Datos recibidos para crear cambio de turno:', req.body);

    // Verificar que el empleado que está creando la solicitud no sea jefe de área
    const empleadoId = req.body.empleado_id;
    if (empleadoId) {
      const Usuario = require('../../models/Usuario');
      const Rol = require('../../models/Rol');
      
      const usuario = await Usuario.findOne({
        where: { empleado_id: empleadoId },
        include: [
          {
            model: Rol,
            as: 'roles',
            attributes: ['nombre']
          }
        ]
      });
      
      if (usuario) {
        const esJefeArea = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA');
        if (esJefeArea) {
          console.log('❌ Jefe de área intentando crear solicitud - Acceso denegado');
          return res.status(403).json({ 
            message: 'Los jefes de área no pueden crear solicitudes de cambio de turno desde la interfaz de gestión. Deben hacerlo desde su cuenta personal.' 
          });
        }
      }
    }

    // Validar campos obligatorios manualmente (para depuración)
    const camposObligatorios = [
      'empleado_id', 'fecha', 'horario_cambiar', 'horario_reemplazo',
      'motivo', 'nombre_reemplazo', 'cedula_reemplazo', 'afectacion_nomina', 'correo', 'estado'
    ];
    for (const campo of camposObligatorios) {
      if (!req.body[campo]) {
        console.error(`Falta el campo obligatorio: ${campo}`);
      }
    }

    // Preparar datos para crear la solicitud, asegurando fecha_creacion sea la fecha actual
    const datosSolicitud = {
      ...req.body,
      fecha_creacion: new Date() // Establecer explícitamente la fecha de creación como hoy
    };
    
    // Crear la solicitud
    const nueva = await CambioTurno.create(datosSolicitud, { transaction: t });
    console.log('Solicitud de cambio de turno creada:', nueva);
    console.log('Fecha de creación guardada:', nueva.fecha_creacion);

    // Buscar al empleado de reemplazo por cédula
    let empleadoReemplazo = null;
    if (req.body.cedula_reemplazo) {
      empleadoReemplazo = await Empleado.findOne({ where: { documento: req.body.cedula_reemplazo } });
      console.log('Empleado de reemplazo encontrado:', empleadoReemplazo ? empleadoReemplazo.nombres : 'No encontrado');
    }

    // Notificar por correo si existe
    if (empleadoReemplazo && empleadoReemplazo.email) {
      try {
        // Importar las plantillas de correo
        const { getCambioTurnoVistoBuenoTemplate } = require('../../utils/emailTemplates');
        
        // Buscar al empleado solicitante
        const empleadoSolicitante = await Empleado.findByPk(req.body.empleado_id);
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getCambioTurnoVistoBuenoTemplate(empleadoReemplazo, nueva, empleadoSolicitante);
        
        await sendMail(
          empleadoReemplazo.email,
          'Solicitud de Cambio de Turno - Visto Bueno',
          emailHTML
        );
        console.log('Correo de notificación enviado a:', empleadoReemplazo.email);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación:', mailError);
      }
    }

    await t.commit();
    console.log('--- FIN crearCambioTurno (éxito) ---');
    res.status(201).json(nueva);
  } catch (error) {
    await t.rollback();
    console.error('Error en crearCambioTurno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar todas las solicitudes (no eliminadas) con filtro por departamento para jefes/gerentes
exports.listarCambiosTurno = async (req, res) => {
  try {
    const { jefeId } = req.query;
    
    console.log('🔍 Listando cambios de turno...');
    console.log(`   Jefe ID: ${jefeId || 'No especificado'}`);
    
    let cambios;
    
    // Si se especifica un jefeId, filtrar por departamento
    if (jefeId) {
      console.log('🔍 Filtrando por departamento del jefe...');
      
      // 1. Obtener información del jefe/gerente
      const [jefeData] = await db.query(`
        SELECT 
          e.id,
          e.nombres,
          e.documento,
          e.email,
          a.nombre as area_nombre,
          d.nombre as departamento_nombre
        FROM empleados e
        LEFT JOIN empleados_areas ea ON e.id = ea.empleado_id
        LEFT JOIN areas a ON ea.area_id = a.id
        LEFT JOIN departamentos d ON a.departamento_id = d.id
        WHERE e.id = ${jefeId}
      `);
      
      if (jefeData.length === 0) {
        console.log('❌ No se encontró el jefe/gerente');
        return res.json([]);
      }
      
      const jefe = jefeData[0];
      console.log('✅ Jefe encontrado:');
      console.log(`   Nombre: ${jefe.nombres}`);
      console.log(`   Área: ${jefe.area_nombre || 'Sin área'}`);
      console.log(`   Departamento: ${jefe.departamento_nombre || 'Sin departamento'}`);
      
      // 2. Determinar el departamento que gestiona
      let departamentoGestionado = null;
      const departamentoPersonal = jefe.departamento_nombre;
      
      if (departamentoPersonal === 'GERENCIA') {
        departamentoGestionado = 'ASISTENCIAL';
        console.log(`   ✅ Como es GERENTE y pertenece a GERENCIA, gestiona ASISTENCIAL`);
      } else {
        departamentoGestionado = departamentoPersonal;
        console.log(`   ✅ Usando departamento personal: ${departamentoPersonal}`);
      }
      
      console.log(`   Departamento gestionado: ${departamentoGestionado}`);
      
      if (!departamentoGestionado) {
        console.log('❌ No se pudo determinar el departamento gestionado');
        return res.json([]);
      }
      
      // 3. Buscar empleados del departamento gestionado
      const [empleadosDepartamento] = await db.query(`
        SELECT 
          ea.empleado_id,
          e.nombres,
          e.documento,
          a.nombre as area_nombre,
          d.nombre as departamento_nombre
        FROM empleados_areas ea
        INNER JOIN empleados e ON ea.empleado_id = e.id
        INNER JOIN areas a ON ea.area_id = a.id
        INNER JOIN departamentos d ON a.departamento_id = d.id
        WHERE d.nombre = '${departamentoGestionado}'
      `);
      
      console.log(`📊 Empleados encontrados en ${departamentoGestionado}: ${empleadosDepartamento.length}`);
      empleadosDepartamento.forEach(emp => {
        console.log(`   - ${emp.nombres} (${emp.documento}) - ${emp.area_nombre}`);
      });
      
      if (empleadosDepartamento.length === 0) {
        console.log(`❌ No se encontraron empleados en el departamento ${departamentoGestionado}`);
        return res.json([]);
      }
      
      const empleadoIds = empleadosDepartamento.map(ed => ed.empleado_id);
      
      // 4. Buscar cambios de turno de esos empleados con información del departamento
      const [cambiosData] = await db.query(`
        SELECT 
          ct.*,
          e.nombres as empleado_nombre,
          e.documento as empleado_documento,
          e.id as empleado_id,
          a.nombre as area_nombre,
          d.nombre as departamento_nombre
        FROM solicitudes_cambio_turno ct
        INNER JOIN empleados e ON ct.empleado_id = e.id
        LEFT JOIN empleados_areas ea ON e.id = ea.empleado_id
        LEFT JOIN areas a ON ea.area_id = a.id
        LEFT JOIN departamentos d ON a.departamento_id = d.id
        WHERE ct.empleado_id IN (${empleadoIds.join(',')})
          AND ct.deleted_at IS NULL
        ORDER BY ct.fecha_creacion DESC
      `);
      
      console.log(`📊 Cambios de turno encontrados: ${cambiosData.length}`);
      cambiosData.forEach(cambio => {
        console.log(`   ID: ${cambio.id}, Solicitante: ${cambio.empleado_nombre}, Estado: ${cambio.estado}`);
      });
      
      // 5. Formatear la respuesta
      cambios = cambiosData.map(cambio => ({
        id: cambio.id,
        estado: cambio.estado,
        visto_bueno_reemplazo: cambio.visto_bueno_reemplazo,
        nombre_reemplazo: cambio.nombre_reemplazo,
        cedula_reemplazo: cambio.cedula_reemplazo,
        fecha: cambio.fecha,
        fecha_turno_reemplazo: cambio.fecha_turno_reemplazo,
        fecha_creacion: cambio.fecha_creacion,
        motivo: cambio.motivo,
        horario_cambiar: cambio.horario_cambiar,
        horario_reemplazo: cambio.horario_reemplazo,
        observaciones: cambio.observaciones,
        afectacion_nomina: cambio.afectacion_nomina,
        empleado: {
          id: cambio.empleado_id,
          nombres: cambio.empleado_nombre,
          documento: cambio.empleado_documento,
          areas: [{
            departamento: {
              nombre: cambio.departamento_nombre
            }
          }]
        }
      }));
      
    } else {
      // Si no se especifica jefeId, mostrar todos (comportamiento original)
      console.log('🔍 Mostrando todos los cambios de turno...');
      cambios = await CambioTurno.findAll({
        where: { deleted_at: null },
        attributes: [
          'id', 'estado', 'visto_bueno_reemplazo', 'nombre_reemplazo', 
          'cedula_reemplazo', 'fecha', 'fecha_turno_reemplazo', 'fecha_creacion', 'motivo', 
          'horario_cambiar', 'horario_reemplazo', 'observaciones', 'afectacion_nomina'
        ],
        include: [
          {
            model: Empleado,
            as: 'empleado',
            attributes: ['nombres', 'documento', 'id']
          }
        ]
      });
    }
    
    console.log(`✅ Total de cambios de turno devueltos: ${cambios.length}`);
    res.json(cambios);
    
  } catch (error) {
    console.error('Error en listarCambiosTurno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener una solicitud por ID
exports.obtenerCambioTurno = async (req, res) => {
  try {
    const cambio = await CambioTurno.findByPk(req.params.id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento']
        }
      ]
    });
    if (!cambio || cambio.deleted_at) return res.status(404).json({ message: 'No encontrado' });
    res.json(cambio);
  } catch (error) {
    console.error('Error en obtenerCambioTurno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una solicitud
exports.actualizarCambioTurno = async (req, res) => {
  try {
    const cambio = await CambioTurno.findByPk(req.params.id);
    if (!cambio || cambio.deleted_at) return res.status(404).json({ message: 'No encontrado' });
    await cambio.update(req.body);
    res.json(cambio);
  } catch (error) {
    console.error('Error en actualizarCambioTurno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminado lógico
exports.eliminarCambioTurno = async (req, res) => {
  try {
    const cambio = await CambioTurno.findByPk(req.params.id);
    if (!cambio || cambio.deleted_at) return res.status(404).json({ message: 'No encontrado' });
    await cambio.destroy();
    res.json({ message: 'Eliminado correctamente (lógico)' });
  } catch (error) {
    console.error('Error en eliminarCambioTurno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes pendientes por visto bueno para un documento de reemplazo
exports.listarPendientesVistoBueno = async (req, res) => {
  try {
    const { documento } = req.query;
    if (!documento) return res.status(400).json({ error: 'Falta el documento del usuario' });
    
    console.log('🔍 Buscando solicitudes pendientes por visto bueno para documento:', documento);
    
    // Buscar el empleado por documento o ID
    let empleado = await Empleado.findOne({ 
      where: { documento: documento },
      attributes: ['id', 'nombres', 'documento', 'email', 'codigo']
    });
    
    // Si no se encuentra por documento, intentar por ID
    if (!empleado && !isNaN(documento)) {
      empleado = await Empleado.findByPk(documento, {
        attributes: ['id', 'nombres', 'documento', 'email', 'codigo']
      });
    }
    
    // Si no se encuentra, buscar por nombre (para casos donde el documento no coincida exactamente)
    if (!empleado) {
      console.log('🔍 Intentando búsqueda por nombre...');
      empleado = await Empleado.findOne({
        where: {
          nombres: {
            [require('sequelize').Op.like]: `%${documento}%`
          }
        },
        attributes: ['id', 'nombres', 'documento', 'email', 'codigo']
      });
    }
    
    if (!empleado) {
      console.log('❌ No se encontró empleado con documento/ID/nombre:', documento);
      return res.json([]);
    }
    
    console.log('✅ Empleado encontrado:', empleado.nombres, 'ID:', empleado.id, 'Documento:', empleado.documento);
    
    // Verificar si el empleado es jefe de área
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    const usuario = await Usuario.findOne({
      where: { empleado_id: empleado.id },
      include: [
        {
          model: Rol,
          as: 'roles',
          attributes: ['nombre']
        }
      ]
    });
    
    if (usuario) {
      const esJefeArea = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA');
      if (esJefeArea) {
        console.log('❌ El empleado es jefe de área, no puede dar visto bueno');
        return res.json([]); // Retornar lista vacía para jefes de área
      }
    }
    
    // Buscar solicitudes donde este empleado es el reemplazo
    // Intentar con documento, código, ID y nombre
    const identificadores = [
      empleado.documento,
      empleado.codigo,
      empleado.id.toString(),
      empleado.nombres // También buscar por nombre
    ].filter(Boolean); // Filtrar valores null/undefined

    console.log('🔍 Buscando con identificadores:', identificadores);
    
    // Búsqueda más flexible
    const cambios = await CambioTurno.findAll({
      where: {
        [require('sequelize').Op.or]: [
          {
            cedula_reemplazo: {
              [require('sequelize').Op.in]: identificadores
            }
          },
          {
            nombre_reemplazo: empleado.nombres
          }
        ],
        visto_bueno_reemplazo: 'Pendiente',
        deleted_at: null
      },
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        }
      ]
    });
    
    console.log(`📊 Solicitudes pendientes encontradas: ${cambios.length}`);
    cambios.forEach(sol => {
      console.log(`   ID: ${sol.id}, Solicitante: ${sol.empleado?.nombres}, Reemplazo: ${sol.nombre_reemplazo} (${sol.cedula_reemplazo})`);
    });
    
    res.json(cambios);
  } catch (error) {
    console.error('Error en listarPendientesVistoBueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar visto bueno de una solicitud
exports.aprobarVistoBueno = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO aprobarVistoBueno ---');
    const { id } = req.params;
    const { motivo } = req.body;

    const cambio = await CambioTurno.findByPk(id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        }
      ]
    });

    if (!cambio || cambio.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (cambio.visto_bueno_reemplazo !== 'Pendiente') {
      return res.status(400).json({ message: 'El visto bueno ya no está pendiente' });
    }

    // Verificar que el empleado de reemplazo no sea jefe de área
    const empleadoReemplazoVerificacion = await Empleado.findOne({
      where: { documento: cambio.cedula_reemplazo }
    });

    if (empleadoReemplazoVerificacion) {
      const Usuario = require('../../models/Usuario');
      const Rol = require('../../models/Rol');
      
      const usuarioReemplazo = await Usuario.findOne({
        where: { empleado_id: empleadoReemplazoVerificacion.id },
        include: [
          {
            model: Rol,
            as: 'roles',
            attributes: ['nombre']
          }
        ]
      });
      
      if (usuarioReemplazo) {
        const esJefeArea = usuarioReemplazo.roles?.some(rol => rol.nombre === 'JEFE AREA');
        if (esJefeArea) {
          console.log('❌ El empleado de reemplazo es jefe de área, no puede dar visto bueno');
          return res.status(403).json({ 
            message: 'Los jefes de área no pueden dar visto bueno a las solicitudes' 
          });
        }
      }
    }

    // Actualizar el visto bueno
    await cambio.update({
      visto_bueno_reemplazo: 'Aprobado',
      estado: 'En Revisión' // Cambiar estado para que pase a revisión por jefes
    }, { transaction: t });

    // Buscar al empleado que dio el visto bueno (reemplazo)
    const empleadoReemplazo = await Empleado.findOne({
      where: { documento: cambio.cedula_reemplazo }
    });

    // Notificar al solicitante que su visto bueno fue aprobado
    if (cambio.empleado && cambio.empleado.email) {
      try {
        // Importar las plantillas de correo
        const { getVistoBuenoAprobadoTemplate } = require('../../utils/emailTemplates');
        
        // Buscar al empleado de reemplazo
        const empleadoReemplazo = await Empleado.findOne({ where: { documento: cambio.cedula_reemplazo } });
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getVistoBuenoAprobadoTemplate(cambio.empleado, cambio, empleadoReemplazo);
        
        await sendMail(
          cambio.empleado.email,
          'Visto Bueno Aprobado - Cambio de Turno',
          emailHTML
        );
        console.log('Correo de notificación enviado al solicitante:', cambio.empleado.email);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación:', mailError);
      }
    }

    await t.commit();
    console.log('--- FIN aprobarVistoBueno (éxito) ---');
    res.json({ 
      message: 'Visto bueno aprobado correctamente',
      cambio: cambio
    });
  } catch (error) {
    await t.rollback();
    console.error('Error en aprobarVistoBueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar visto bueno de una solicitud
exports.rechazarVistoBueno = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO rechazarVistoBueno ---');
    const { id } = req.params;
    const { motivo } = req.body;

    const cambio = await CambioTurno.findByPk(id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        }
      ]
    });

    if (!cambio || cambio.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (cambio.visto_bueno_reemplazo !== 'Pendiente') {
      return res.status(400).json({ message: 'El visto bueno ya no está pendiente' });
    }

    // Verificar que el empleado de reemplazo no sea jefe de área
    const empleadoReemplazoVerificacion = await Empleado.findOne({
      where: { documento: cambio.cedula_reemplazo }
    });

    if (empleadoReemplazoVerificacion) {
      const Usuario = require('../../models/Usuario');
      const Rol = require('../../models/Rol');
      
      const usuarioReemplazo = await Usuario.findOne({
        where: { empleado_id: empleadoReemplazoVerificacion.id },
        include: [
          {
            model: Rol,
            as: 'roles',
            attributes: ['nombre']
          }
        ]
      });
      
      if (usuarioReemplazo) {
        const esJefeArea = usuarioReemplazo.roles?.some(rol => rol.nombre === 'JEFE AREA');
        if (esJefeArea) {
          console.log('❌ El empleado de reemplazo es jefe de área, no puede dar visto bueno');
          return res.status(403).json({ 
            message: 'Los jefes de área no pueden dar visto bueno a las solicitudes' 
          });
        }
      }
    }

    // Actualizar el visto bueno
    await cambio.update({
      visto_bueno_reemplazo: 'Rechazado',
      estado: 'Rechazado',
      observaciones: motivo ? `Rechazado por reemplazo: ${motivo}` : 'Rechazado por empleado de reemplazo'
    }, { transaction: t });

    // Notificar al solicitante que su visto bueno fue rechazado
    if (cambio.empleado && cambio.empleado.email) {
      try {
        // Importar las plantillas de correo
        const { getVistoBuenoRechazadoTemplate } = require('../../utils/emailTemplates');
        
        // Buscar al empleado de reemplazo
        const empleadoReemplazo = await Empleado.findOne({ where: { documento: cambio.cedula_reemplazo } });
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getVistoBuenoRechazadoTemplate(cambio.empleado, cambio, empleadoReemplazo, motivo);
        
        await sendMail(
          cambio.empleado.email,
          'Visto Bueno Rechazado - Cambio de Turno',
          emailHTML
        );
        console.log('Correo de notificación enviado al solicitante:', cambio.empleado.email);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación:', mailError);
      }
    }

    await t.commit();
    console.log('--- FIN rechazarVistoBueno (éxito) ---');
    res.json({
      message: 'Visto bueno rechazado correctamente',
      cambio: cambio
    });
  } catch (error) {
    await t.rollback();
    console.error('Error en rechazarVistoBueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes en revisión para jefes de área y gerentes
exports.listarEnRevision = async (req, res) => {
  try {
    const { jefeId, departamentoGestionado } = req.query;
    
    if (!jefeId) return res.status(400).json({ error: 'Falta el ID del jefe' });
    if (!departamentoGestionado) return res.status(400).json({ error: 'Falta el departamento gestionado' });
    
    console.log('🔍 Buscando solicitudes en revisión para jefe ID:', jefeId);
    console.log('🔍 Departamento gestionado:', departamentoGestionado);
    
    // Buscar directamente las solicitudes del departamento gestionado que están en revisión
    let whereClause = '';
    if (departamentoGestionado === 'TODOS') {
      // Para admins, mostrar todas las solicitudes en revisión
      whereClause = `
        WHERE ct.estado = 'En Revisión'
          AND ct.visto_bueno_reemplazo = 'Aprobado'
          AND ct.deleted_at IS NULL
      `;
    } else {
      // Para jefes específicos, filtrar por departamento
      whereClause = `
        WHERE d.nombre = '${departamentoGestionado}'
          AND ct.estado = 'En Revisión'
          AND ct.visto_bueno_reemplazo = 'Aprobado'
          AND ct.deleted_at IS NULL
      `;
    }
    
    const [cambios] = await db.query(`
      SELECT 
        ct.*,
        e.nombres as empleado_nombre,
        e.documento as empleado_documento,
        e.email as empleado_email,
        e.oficio as empleado_oficio,
        a.nombre as area_nombre,
        d.nombre as departamento_nombre
      FROM solicitudes_cambio_turno ct
      INNER JOIN empleados e ON ct.empleado_id = e.id
      LEFT JOIN empleados_areas ea ON e.id = ea.empleado_id
      LEFT JOIN areas a ON ea.area_id = a.id
      LEFT JOIN departamentos d ON a.departamento_id = d.id
      ${whereClause}
      ORDER BY ct.fecha_creacion DESC
    `);
    
    console.log(`📊 Solicitudes en revisión encontradas para ${departamentoGestionado}: ${cambios.length}`);
    cambios.forEach(sol => {
      console.log(`   ID: ${sol.id}, Solicitante: ${sol.empleado_nombre}, Reemplazo: ${sol.nombre_reemplazo}, Estado: ${sol.estado}`);
    });
    
    // Formatear la respuesta para que coincida con el formato esperado por el frontend
    const cambiosFormateados = cambios.map(cambio => ({
      id: cambio.id,
      estado: cambio.estado,
      visto_bueno_reemplazo: cambio.visto_bueno_reemplazo,
      nombre_reemplazo: cambio.nombre_reemplazo,
      cedula_reemplazo: cambio.cedula_reemplazo,
      fecha: cambio.fecha,
      fecha_turno_reemplazo: cambio.fecha_turno_reemplazo,
      fecha_creacion: cambio.fecha_creacion,
      motivo: cambio.motivo,
      horario_cambiar: cambio.horario_cambiar,
      horario_reemplazo: cambio.horario_reemplazo,
      observaciones: cambio.observaciones,
      afectacion_nomina: cambio.afectacion_nomina,
      empleado: {
        id: cambio.empleado_id,
        nombres: cambio.empleado_nombre,
        documento: cambio.empleado_documento,
        email: cambio.empleado_email,
        oficio: cambio.empleado_oficio
      }
    }));
    
    res.json(cambiosFormateados);
  } catch (error) {
    console.error('Error en listarEnRevision:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud por jefe de área
exports.aprobarPorJefe = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO aprobarPorJefe ---');
    const { id } = req.params;
    const { motivo, documentoJefe } = req.body;
    
    console.log('📋 Datos recibidos:', { id, motivo, documentoJefe });

    const cambio = await CambioTurno.findByPk(id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        }
      ]
    });

    if (!cambio || cambio.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (cambio.estado !== 'En Revisión' || cambio.visto_bueno_reemplazo !== 'Aprobado') {
      return res.status(400).json({ message: 'La solicitud no está en estado de revisión' });
    }

    // Actualizar el estado
    await cambio.update({
      estado: 'Aprobado',
      observaciones: motivo ? `${cambio.observaciones || ''}\nAprobado por jefe: ${motivo}`.trim() : cambio.observaciones
    }, { transaction: t });

    // Notificar al solicitante que su solicitud fue aprobada
    if (cambio.empleado && cambio.empleado.email) {
      try {
        console.log('📧 Enviando notificación al solicitante:', cambio.empleado.email);
        
        // Importar las plantillas de correo
        const { getCambioTurnoAprobadoTemplate } = require('../../utils/emailTemplates');
        
        // Buscar al jefe que aprobó - usar el documento que viene en el body
        let jefe = null;
        const documentoJefeFinal = documentoJefe || req.user?.documento || req.user?.empleado?.documento;
        
        if (documentoJefeFinal) {
          jefe = await Empleado.findOne({ where: { documento: documentoJefeFinal } });
          console.log('👤 Jefe encontrado:', jefe?.nombres, 'Documento:', documentoJefeFinal);
        } else {
          console.log('⚠️ No se pudo obtener el documento del jefe');
        }
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getCambioTurnoAprobadoTemplate(cambio.empleado, cambio, jefe);
        
        await sendMail(
          cambio.empleado.email,
          'Solicitud de Cambio de Turno Aprobada',
          emailHTML
        );
        console.log('✅ Correo de notificación enviado al solicitante:', cambio.empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación al solicitante:', mailError);
      }
    } else {
      console.log('⚠️ No se puede enviar notificación al solicitante - email no disponible');
    }

    // Notificar al empleado de reemplazo
    const empleadoReemplazo = await Empleado.findOne({
      where: { documento: cambio.cedula_reemplazo }
    });

    if (empleadoReemplazo && empleadoReemplazo.email) {
      try {
        console.log('📧 Enviando notificación al reemplazo:', empleadoReemplazo.email);
        
        // Importar las plantillas de correo
        const { getReemplazoAprobadoTemplate } = require('../../utils/emailTemplates');
        
        // Buscar al jefe que aprobó - usar la misma lógica que arriba
        let jefe = null;
        const documentoJefeFinal = documentoJefe || req.user?.documento || req.user?.empleado?.documento;
        
        if (documentoJefeFinal) {
          jefe = await Empleado.findOne({ where: { documento: documentoJefeFinal } });
          console.log('👤 Jefe para notificación al reemplazo:', jefe?.nombres, 'Documento:', documentoJefeFinal);
        }
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getReemplazoAprobadoTemplate(empleadoReemplazo, cambio, cambio.empleado, jefe);
        
        await sendMail(
          empleadoReemplazo.email,
          'Cambio de Turno Confirmado - Eres el Reemplazo',
          emailHTML
        );
        console.log('✅ Correo de notificación enviado al reemplazo:', empleadoReemplazo.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación al reemplazo:', mailError);
      }
    } else {
      console.log('⚠️ No se puede enviar notificación al reemplazo - empleado no encontrado o sin email');
      console.log('🔍 Documento del reemplazo buscado:', cambio.cedula_reemplazo);
    }

    await t.commit();
    console.log('--- FIN aprobarPorJefe (éxito) ---');
    res.json({
      message: 'Solicitud aprobada correctamente por el jefe',
      cambio: cambio
    });
  } catch (error) {
    await t.rollback();
    console.error('Error en aprobarPorJefe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud por jefe de área
exports.rechazarPorJefe = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO rechazarPorJefe ---');
    const { id } = req.params;
    const { motivo } = req.body;

    const cambio = await CambioTurno.findByPk(id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        }
      ]
    });

    if (!cambio || cambio.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (cambio.estado !== 'En Revisión' || cambio.visto_bueno_reemplazo !== 'Aprobado') {
      return res.status(400).json({ message: 'La solicitud no está en estado de revisión' });
    }

    // Actualizar el estado
    await cambio.update({
      estado: 'Rechazado',
      observaciones: motivo ? `${cambio.observaciones || ''}\nRechazado por jefe: ${motivo}`.trim() : cambio.observaciones
    }, { transaction: t });

    // Notificar al solicitante que su solicitud fue rechazada
    if (cambio.empleado && cambio.empleado.email) {
      try {
        // Importar las plantillas de correo
        const { getCambioTurnoRechazadoTemplate } = require('../../utils/emailTemplates');
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getCambioTurnoRechazadoTemplate(cambio.empleado, cambio, motivo);
        
        await sendMail(
          cambio.empleado.email,
          'Solicitud de Cambio de Turno Rechazada',
          emailHTML
        );
        console.log('Correo de notificación enviado al solicitante:', cambio.empleado.email);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación:', mailError);
      }
    }

    // Notificar al empleado de reemplazo
    const empleadoReemplazo = await Empleado.findOne({
      where: { documento: cambio.cedula_reemplazo }
    });

    if (empleadoReemplazo && empleadoReemplazo.email) {
      try {
        // Importar las plantillas de correo
        const { getReemplazoRechazadoTemplate } = require('../../utils/emailTemplates');
        
        // Generar el HTML del correo con la nueva plantilla
        const emailHTML = getReemplazoRechazadoTemplate(empleadoReemplazo, cambio, cambio.empleado, motivo);
        
        await sendMail(
          empleadoReemplazo.email,
          'Cambio de Turno Rechazado',
          emailHTML
        );
        console.log('Correo de notificación enviado al reemplazo:', empleadoReemplazo.email);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación al reemplazo:', mailError);
      }
    }

    await t.commit();
    console.log('--- FIN rechazarPorJefe (éxito) ---');
    res.json({
      message: 'Solicitud rechazada correctamente por el jefe',
      cambio: cambio
    });
  } catch (error) {
    await t.rollback();
    console.error('Error en rechazarPorJefe:', error);
    res.status(500).json({ error: error.message });
  }
}; 

// Listar cambios de turno por empleado específico
exports.listarCambiosTurnoPorEmpleado = async (req, res) => {
  try {
    const { empleadoId } = req.params;
    
    console.log('🔍 Listando cambios de turno para empleado:', empleadoId);
    
    if (!empleadoId) {
      return res.status(400).json({ error: 'ID de empleado requerido' });
    }

    const cambios = await CambioTurno.findAll({
      where: { 
        empleado_id: empleadoId,
        deleted_at: null 
      },
      attributes: [
        'id', 'estado', 'visto_bueno_reemplazo', 'nombre_reemplazo', 
        'cedula_reemplazo', 'fecha', 'fecha_turno_reemplazo', 'motivo', 'horario_cambiar', 'horario_reemplazo',
        'fecha_creacion', 'observaciones', 'afectacion_nomina'
      ],
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['nombres', 'documento', 'id']
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    console.log(`✅ Cambios de turno encontrados para empleado ${empleadoId}: ${cambios.length}`);
    res.json(cambios);
    
  } catch (error) {
    console.error('Error en listarCambiosTurnoPorEmpleado:', error);
    res.status(500).json({ error: error.message });
  }
}; 