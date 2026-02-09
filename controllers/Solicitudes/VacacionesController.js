const models = require('../../models');
const Vacaciones = models.Vacaciones;
const Empleado = models.Empleado;
const Area = models.Area;
const Departamento = models.Departamento;
const Usuario = models.Usuario;
const Rol = models.Rol;
const { sendMail } = require('../../utils/mailer');
const { generarPDFVacaciones } = require('../../utils/pdfGenerator');
const db = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/vacaciones';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vacaciones-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Solo permitir archivos PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Middleware para subida de archivos
const uploadPDF = upload.single('archivo_pdf');

// Función auxiliar para enviar correos con archivos adjuntos
const enviarCorreoConAdjunto = async (email, asunto, template, empleado, jefe, solicitud, archivoPath = null) => {
  try {
    console.log('📧 Preparando correo para:', email);
    console.log('📧 Asunto:', asunto);
    console.log('📧 Archivo adjunto:', archivoPath || 'NINGUNO');
    
    // Verificar que el archivo existe si se proporcionó una ruta
    if (archivoPath) {
      const fs = require('fs');
      if (!fs.existsSync(archivoPath)) {
        console.error('❌ ERROR: El archivo adjunto no existe:', archivoPath);
        console.warn('⚠️ Se enviará el correo sin adjunto');
        archivoPath = null; // Continuar sin adjunto
      } else {
        const stats = fs.statSync(archivoPath);
        console.log('✅ Archivo adjunto verificado:', archivoPath);
        console.log('📊 Tamaño:', stats.size, 'bytes');
      }
    }
    
    // Determinar qué parámetros pasar al template basado en su firma
    let emailHTML;
    if (template.length === 2) {
      // Template que solo necesita empleado y solicitud
      emailHTML = template(empleado, solicitud);
    } else if (template.length === 3) {
      // Template que necesita empleado, jefe y solicitud
      emailHTML = template(empleado, jefe, solicitud);
    } else {
      // Fallback: intentar con empleado y solicitud
      emailHTML = template(empleado, solicitud);
    }
    
    await sendMail(email, asunto, emailHTML, archivoPath);
    console.log('✅ Correo enviado exitosamente a:', email);
    if (archivoPath) {
      console.log('📎 Con archivo adjunto:', archivoPath);
    } else {
      console.log('⚠️ Correo enviado SIN adjunto');
    }
  } catch (mailError) {
    console.error('❌ Error al enviar correo:', mailError);
    console.error('❌ Stack trace:', mailError.stack);
    // No lanzar el error para no interrumpir el flujo principal
  }
};

// Crear nueva solicitud de vacaciones
exports.crearVacaciones = async (req, res) => {
  const t = await db.transaction();
  
  try {
    // Usar multer para procesar el archivo
    uploadPDF(req, res, async function(err) {
      if (err) {
        console.error('Error en multer:', err);
        return res.status(400).json({ error: err.message });
      }

      try {
        // Verificar que el usuario no sea jefe de área
        const empleadoVerificacion = await Empleado.findOne({
          where: { id: req.body.empleado_id },
          include: [
            {
              model: Usuario,
              as: 'usuario',
              include: [
                {
                  model: Rol,
                  as: 'roles',
                  attributes: ['nombre']
                }
              ]
            }
          ]
        });

        if (empleadoVerificacion?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
          console.log('❌ Jefe de área intentando crear solicitud de vacaciones - Acceso denegado');
          return res.status(403).json({
            message: 'Los jefes de área no pueden crear solicitudes de vacaciones desde la interfaz de gestión. Deben hacerlo desde su cuenta personal de empleado.'
          });
        }

        // Validar campos obligatorios
        const camposObligatorios = [
          'empleado_id', 'ciudad_departamento', 'fecha_solicitud', 'nombres_colaborador',
          'cedula_colaborador', 'periodo_cumplido_desde', 'periodo_cumplido_hasta',
          'dias_cumplidos', 'periodo_disfrute_desde', 'periodo_disfrute_hasta', 'dias_disfrute',
          'solicitante_nombre', 'solicitante_cargo', 'jefe_nombre', 'jefe_cargo'
        ];
        
        // Campos numéricos que pueden ser 0
        const camposNumericos = ['dias_cumplidos', 'dias_disfrute'];
        
        for (const campo of camposObligatorios) {
          if (camposNumericos.includes(campo)) {
            // Para campos numéricos, permitir 0 pero no undefined/null
            if (req.body[campo] === undefined || req.body[campo] === null) {
              return res.status(400).json({ error: `Falta el campo obligatorio: ${campo}` });
            }
          } else {
            // Para campos de texto, verificar que no esté vacío
            if (!req.body[campo]) {
              return res.status(400).json({ error: `Falta el campo obligatorio: ${campo}` });
            }
          }
        }

        // Preparar datos para la base de datos
        const datosVacacion = { ...req.body };
        
        // Si se subió un archivo, agregar la ruta
        if (req.file) {
          datosVacacion.archivo_pdf = req.file.path;
          console.log('✅ Archivo PDF subido:', req.file.path);
        }

        // Crear la solicitud
        const nueva = await Vacaciones.create(datosVacacion, { transaction: t });
        
        // Generar PDF de la solicitud de vacaciones
        let pdfPath = null;
        let pdfResult = null;
        try {
            console.log('📄 Generando PDF de solicitud de vacaciones...');
            
            // Obtener información del jefe para el PDF
            const empleado = await Empleado.findByPk(req.body.empleado_id);
            const jefe = await Empleado.findByPk(empleado.jefe_id);
            
            pdfResult = await generarPDFVacaciones(nueva, empleado, jefe);
            pdfPath = pdfResult.filePath;
            
            console.log('✅ PDF generado exitosamente:', pdfResult.fileName);
            
            // Si no se subió un archivo manualmente, guardar el PDF generado en archivo_pdf
            if (!req.file && pdfResult.relativePath) {
              await nueva.update(
                { archivo_pdf: pdfResult.relativePath },
                { transaction: t }
              );
              console.log('✅ PDF generado guardado en archivo_pdf:', pdfResult.relativePath);
            }
        } catch (pdfError) {
            console.error('❌ Error generando PDF:', pdfError);
            // No interrumpir el flujo si falla la generación del PDF
        }
        
        // Notificar por correo al empleado (SIN PDF - solo confirmación de creación)
        const empleado = await Empleado.findByPk(req.body.empleado_id);
        if (empleado && empleado.email) {
          try {
            const { getVacacionesCreadaTemplate } = require('../../utils/emailTemplates');
            
            // NO incluir archivo PDF al empleado al crear la solicitud
            // El PDF se enviará solo cuando todos den el visto bueno
            
            await enviarCorreoConAdjunto(
              empleado.email,
              '✨ Solicitud de Vacaciones Creada - Portal UCI',
              getVacacionesCreadaTemplate,
              empleado,
              null, // jefe no necesario para este template
              nueva,
              null // NO enviar PDF al empleado al crear
            );
          } catch (mailError) {
            console.error('❌ Error al enviar correo de notificación:', mailError);
          }
        }
        
        // Notificar al jefe inmediatamente SIN EL PDF
        console.log('🔍 DEBUG: Antes de llamar notificarAJefe');
        console.log('🔍 DEBUG: nueva:', nueva?.id);
        console.log('🔍 DEBUG: empleado:', empleado?.nombres, empleado?.id);
        
        try {
          await notificarAJefe(nueva, empleado, null);
          console.log('✅ DEBUG: notificarAJefe completado exitosamente');
        } catch (notificacionError) {
          console.error('❌ Error en notificarAJefe:', notificacionError);
          console.error('❌ Stack trace:', notificacionError.stack);
          // No interrumpir el flujo principal si falla la notificación
        }
        
        await t.commit();
        res.status(201).json(nueva);
      } catch (error) {
        await t.rollback();
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar todas las solicitudes (no eliminadas)
exports.listarVacaciones = async (req, res) => {
  try {
    const solicitudes = await Vacaciones.findAll({
      where: { deleted_at: null },
      include: [
        { 
          model: Empleado, 
          as: 'empleado', 
          attributes: ['id', 'nombres', 'documento', 'email'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        },
        { model: Empleado, as: 'revisor', attributes: ['id', 'nombres', 'documento'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes de un empleado específico
exports.listarVacacionesEmpleado = async (req, res) => {
  try {
    const { empleado_id } = req.params;
    const solicitudes = await Vacaciones.findAll({
      where: { empleado_id, deleted_at: null },
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] },
        { model: Empleado, as: 'revisor', attributes: ['id', 'nombres', 'documento'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes de empleado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener una solicitud por ID
exports.obtenerVacaciones = async (req, res) => {
  try {
    const solicitud = await Vacaciones.findByPk(req.params.id, {
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] },
        { model: Empleado, as: 'revisor', attributes: ['id', 'nombres', 'documento'] }
      ]
    });
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    res.json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una solicitud
exports.actualizarVacaciones = async (req, res) => {
  try {
    // Validar que el usuario no sea jefe de área
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const empleadoVerificacion = await Empleado.findByPk(empleadoId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (empleadoVerificacion?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      console.log('❌ Jefe de área intentando editar solicitud de vacaciones - Acceso denegado');
      return res.status(403).json({
        message: 'Los jefes de área no pueden editar solicitudes de vacaciones desde la interfaz de gestión. Deben hacerlo desde su cuenta personal de empleado.'
      });
    }

    const solicitud = await Vacaciones.findByPk(req.params.id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    await solicitud.update(req.body);
    // Si se cambió el estado, enviar notificación
    if (req.body.estado && req.body.estado !== solicitud.estado) {
      const empleado = await Empleado.findByPk(solicitud.empleado_id);
      if (empleado && empleado.email) {
        try {
          const estadoText = {
            'en_revision': 'en revisión',
            'aprobado': 'aprobada',
            'rechazado': 'rechazada'
          };
          await sendMail(
            empleado.email,
            `Solicitud de Vacaciones ${estadoText[req.body.estado] || req.body.estado}`,
            `<p>Hola ${empleado.nombres},</p>
             <p>Tu solicitud de vacaciones ha sido ${estadoText[req.body.estado] || req.body.estado}.</p>
             <p>Número de solicitud: ${solicitud.id}</p>
             ${req.body.observaciones ? `<p>Observaciones: ${req.body.observaciones}</p>` : ''}
             ${req.body.motivo_rechazo ? `<p>Motivo del rechazo: ${req.body.motivo_rechazo}</p>` : ''}`
          );
        } catch (mailError) {
          console.error('Error al enviar correo:', mailError);
        }
      }
    }
    res.json(solicitud);
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminado lógico
exports.eliminarVacaciones = async (req, res) => {
  try {
    const solicitud = await Vacaciones.findByPk(req.params.id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    await solicitud.destroy();
    res.json({ message: 'Solicitud eliminada correctamente (lógico)' });
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes por estado
exports.listarVacacionesPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const solicitudes = await Vacaciones.findAll({
      where: { estado, deleted_at: null },
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] },
        { model: Empleado, as: 'revisor', attributes: ['id', 'nombres', 'documento'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes por estado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud
exports.aprobarVacaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones, revisado_por } = req.body;
    
    // Verificar permisos del usuario
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
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
    
    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      return res.status(403).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO');
    if (usuario) {
      console.log('🎭 Roles del usuario:', usuario.roles?.map(r => r.nombre));
      console.log('🏢 Áreas del usuario:', usuario.empleado?.areas?.map(a => ({
        area: a.nombre,
        departamento: a.departamento?.nombre,
        dept_id: a.departamento?.id
      })));
    }
    
    // Verificar si tiene permisos: RRHH o JEFE AREA de RRHH
    const esRRHH = usuario.roles?.some(rol => rol.nombre === 'RRHH');
    const esJefeAreaRRHH = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA') && 
                          usuario.empleado?.areas?.[0]?.departamento?.id === 2; // RRHH
    
    console.log('🔐 Verificación de permisos:');
    console.log('   - esRRHH:', esRRHH);
    console.log('   - esJefeAreaRRHH:', esJefeAreaRRHH);
    console.log('   - Tiene rol JEFE AREA:', usuario.roles?.some(rol => rol.nombre === 'JEFE AREA'));
    console.log('   - Departamento ID:', usuario.empleado?.areas?.[0]?.departamento?.id);
    console.log('   - Departamento nombre:', usuario.empleado?.areas?.[0]?.departamento?.nombre);
    
    if (!esRRHH && !esJefeAreaRRHH) {
      console.log('❌ Usuario no tiene permisos suficientes');
      return res.status(403).json({ 
        message: 'Solo el personal de RRHH o jefes de área de RRHH pueden aprobar solicitudes en este nivel' 
      });
    }
    
    console.log('✅ Usuario tiene permisos, continuando...');
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    await solicitud.update({
      estado: 'aprobado',
      observaciones,
      revisado_por,
      fecha_revision: new Date()
    });
    // Enviar notificación
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        await sendMail(
          empleado.email,
          'Solicitud de Vacaciones Aprobada',
          `<p>Hola ${empleado.nombres},</p>
           <p>Tu solicitud de vacaciones ha sido aprobada.</p>
           <p>Número de solicitud: ${solicitud.id}</p>
           ${observaciones ? `<p>Observaciones: ${observaciones}</p>` : ''}`
        );
      } catch (mailError) {
        console.error('Error al enviar correo:', mailError);
      }
    }
    res.json(solicitud);
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud
exports.rechazarVacaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo, observaciones, revisado_por } = req.body;
    
    // Verificar permisos del usuario
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
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
    
    if (!usuario) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si tiene rol de supervisión
    const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
    const tieneRolSupervision = usuario.roles?.some(rol => rolesSupervision.includes(rol.nombre));
    
    if (!tieneRolSupervision) {
      console.log('❌ Usuario sin permisos intentando rechazar solicitud de vacaciones');
      return res.status(403).json({ 
        message: 'No tienes permisos para rechazar solicitudes de vacaciones. Solo jefes, gerentes, administradores y super administradores pueden rechazar solicitudes.' 
      });
    }
    
    if (!motivo_rechazo) {
      return res.status(400).json({ error: 'El motivo del rechazo es obligatorio' });
    }
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    await solicitud.update({
      estado: 'rechazado',
      motivo_rechazo,
      observaciones,
      revisado_por,
      fecha_revision: new Date()
    });
    // Enviar notificación
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        await sendMail(
          empleado.email,
          'Solicitud de Vacaciones Rechazada',
          `<p>Hola ${empleado.nombres},</p>
           <p>Tu solicitud de vacaciones ha sido rechazada.</p>
           <p>Número de solicitud: ${solicitud.id}</p>
           <p>Motivo del rechazo: ${motivo_rechazo}</p>
           ${observaciones ? `<p>Observaciones: ${observaciones}</p>` : ''}`
        );
      } catch (mailError) {
        console.error('Error al enviar correo:', mailError);
      }
    }
    res.json(solicitud);
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas por empleado
exports.getStatsByEmployee = async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const empleadoIdNum = parseInt(empleadoId);

    // Obtener estadísticas básicas
    const totalVacaciones = await Vacaciones.count({
      where: { empleado_id: empleadoIdNum, deleted_at: null }
    });

    const vacacionesPendientes = await Vacaciones.count({
      where: { empleado_id: empleadoIdNum, estado: 'pendiente', deleted_at: null }
    });

    const vacacionesAprobadas = await Vacaciones.count({
      where: { empleado_id: empleadoIdNum, estado: 'aprobado', deleted_at: null }
    });

    const vacacionesRechazadas = await Vacaciones.count({
      where: { empleado_id: empleadoIdNum, estado: 'rechazado', deleted_at: null }
    });

    const vacacionesEnRevision = await Vacaciones.count({
      where: { empleado_id: empleadoIdNum, estado: 'en_revision', deleted_at: null }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const vacacionesEsteMes = await Vacaciones.count({
      where: {
        empleado_id: empleadoIdNum,
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular días totales solicitados
    const solicitudes = await Vacaciones.findAll({
      where: { empleado_id: empleadoIdNum, deleted_at: null },
      attributes: ['dias_disfrute']
    });

    const diasTotalesSolicitados = solicitudes.reduce((total, solicitud) => {
      return total + (parseInt(solicitud.dias_disfrute) || 0);
    }, 0);

    const diasPromedioPorSolicitud = totalVacaciones > 0 ? diasTotalesSolicitados / totalVacaciones : 0;

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await Vacaciones.count({
        where: {
          empleado_id: empleadoIdNum,
          created_at: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    res.json({
      totalVacaciones,
      vacacionesPendientes,
      vacacionesAprobadas,
      vacacionesRechazadas,
      vacacionesEnRevision,
      vacacionesEsteMes,
      diasTotalesSolicitados,
      diasPromedioPorSolicitud,
      vacacionesPorEmpleado: [],
      vacacionesUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de vacaciones del empleado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas por jefe
exports.getStatsByJefe = async (req, res) => {
  try {
    const { jefeId } = req.params;
    const jefeIdNum = parseInt(jefeId);

    // Obtener empleados a cargo del jefe
    const empleadosACargo = await Empleado.findAll({
      where: { jefe_id: jefeIdNum },
      attributes: ['id']
    });

    const empleadosIds = empleadosACargo.map(emp => emp.id);

    if (empleadosIds.length === 0) {
      return res.json({
        totalVacaciones: 0,
        vacacionesPendientes: 0,
        vacacionesAprobadas: 0,
        vacacionesRechazadas: 0,
        vacacionesEnRevision: 0,
        vacacionesEsteMes: 0,
        diasTotalesSolicitados: 0,
        diasPromedioPorSolicitud: 0,
        vacacionesPorEmpleado: [],
        vacacionesUltimosMeses: []
      });
    }

    // Estadísticas básicas
    const totalVacaciones = await Vacaciones.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      }
    });

    const vacacionesPendientes = await Vacaciones.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'pendiente',
        deleted_at: null 
      }
    });

    const vacacionesAprobadas = await Vacaciones.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'aprobado',
        deleted_at: null 
      }
    });

    const vacacionesRechazadas = await Vacaciones.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'rechazado',
        deleted_at: null 
      }
    });

    const vacacionesEnRevision = await Vacaciones.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'en_revision',
        deleted_at: null 
      }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const vacacionesEsteMes = await Vacaciones.count({
      where: {
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular días totales solicitados
    const solicitudes = await Vacaciones.findAll({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      },
      attributes: ['dias_disfrute'],
      include: [{ model: Empleado, as: 'empleado', attributes: ['nombres'] }]
    });

    const diasTotalesSolicitados = solicitudes.reduce((total, solicitud) => {
      return total + (parseInt(solicitud.dias_disfrute) || 0);
    }, 0);

    const diasPromedioPorSolicitud = totalVacaciones > 0 ? diasTotalesSolicitados / totalVacaciones : 0;

    // Estadísticas por empleado
    const vacacionesPorEmpleado = await Vacaciones.findAll({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      },
      attributes: [
        'empleado_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalVacaciones'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END")), 'aprobadas'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END")), 'pendientes'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END")), 'rechazadas']
      ],
      include: [{ model: Empleado, as: 'empleado', attributes: ['nombres'] }],
      group: ['empleado_id', 'empleado.id', 'empleado.nombres'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
    });

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await Vacaciones.count({
        where: {
          empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
          created_at: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    res.json({
      totalVacaciones,
      vacacionesPendientes,
      vacacionesAprobadas,
      vacacionesRechazadas,
      vacacionesEnRevision,
      vacacionesEsteMes,
      diasTotalesSolicitados,
      diasPromedioPorSolicitud,
      vacacionesPorEmpleado: vacacionesPorEmpleado.map(item => ({
        empleado: item.empleado.nombres,
        totalVacaciones: parseInt(item.dataValues.totalVacaciones),
        aprobadas: parseInt(item.dataValues.aprobadas) || 0,
        pendientes: parseInt(item.dataValues.pendientes) || 0,
        rechazadas: parseInt(item.dataValues.rechazadas) || 0
      })),
      vacacionesUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de vacaciones del jefe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas generales
exports.getStatsGeneral = async (req, res) => {
  try {
    // Estadísticas básicas
    const totalVacaciones = await Vacaciones.count({
      where: { deleted_at: null }
    });

    const vacacionesPendientes = await Vacaciones.count({
      where: { estado: 'pendiente', deleted_at: null }
    });

    const vacacionesAprobadas = await Vacaciones.count({
      where: { estado: 'aprobado', deleted_at: null }
    });

    const vacacionesRechazadas = await Vacaciones.count({
      where: { estado: 'rechazado', deleted_at: null }
    });

    const vacacionesEnRevision = await Vacaciones.count({
      where: { estado: 'en_revision', deleted_at: null }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const vacacionesEsteMes = await Vacaciones.count({
      where: {
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular días totales solicitados
    const solicitudes = await Vacaciones.findAll({
      where: { deleted_at: null },
      attributes: ['dias_disfrute']
    });

    const diasTotalesSolicitados = solicitudes.reduce((total, solicitud) => {
      return total + (parseInt(solicitud.dias_disfrute) || 0);
    }, 0);

    const diasPromedioPorSolicitud = totalVacaciones > 0 ? diasTotalesSolicitados / totalVacaciones : 0;

    // Estadísticas por empleado
    const vacacionesPorEmpleado = await Vacaciones.findAll({
      where: { deleted_at: null },
      attributes: [
        'empleado_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalVacaciones'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END")), 'aprobadas'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END")), 'pendientes'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END")), 'rechazadas']
      ],
      include: [{ model: Empleado, as: 'empleado', attributes: ['nombres'] }],
      group: ['empleado_id', 'empleado.id', 'empleado.nombres'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await Vacaciones.count({
        where: {
          created_at: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    res.json({
      totalVacaciones,
      vacacionesPendientes,
      vacacionesAprobadas,
      vacacionesRechazadas,
      vacacionesEnRevision,
      vacacionesEsteMes,
      diasTotalesSolicitados,
      diasPromedioPorSolicitud,
      vacacionesPorEmpleado: vacacionesPorEmpleado.map(item => ({
        empleado: item.empleado.nombres,
        totalVacaciones: parseInt(item.dataValues.totalVacaciones),
        aprobadas: parseInt(item.dataValues.aprobadas) || 0,
        pendientes: parseInt(item.dataValues.pendientes) || 0,
        rechazadas: parseInt(item.dataValues.rechazadas) || 0
      })),
      vacacionesUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales de vacaciones:', error);
    res.status(500).json({ error: error.message });
  }
}; 

// Listar solicitudes pendientes de visto bueno (para empleados que son reemplazo)
exports.listarPendientesVistoBueno = async (req, res) => {
  try {
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    // Si el empleado es jefe de área, no puede dar visto bueno
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const empleado = await Empleado.findByPk(empleadoId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (empleado?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      console.log('❌ Jefe de área intentando acceder a visto bueno - Acceso denegado');
      return res.json([]);
    }

    // Buscar solicitudes donde este empleado es el reemplazo
    const solicitudes = await Vacaciones.findAll({
      where: { 
        reemplazo_identificacion: empleado?.documento,
        estado: ['pendiente', 'en_revision'], // Incluir tanto pendientes como en revisión
        deleted_at: null 
      },
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Encontradas ${solicitudes.length} solicitudes pendientes de visto bueno para empleado ${empleadoId}`);
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar pendientes de visto bueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar visto bueno de una solicitud
exports.aprobarVistoBueno = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;

    // Verificar que el empleado no sea jefe de área
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const empleado = await Empleado.findByPk(empleadoId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (empleado?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      console.log('❌ Jefe de área intentando dar visto bueno - Acceso denegado');
      return res.status(403).json({
        message: 'Los jefes de área no pueden dar visto bueno a las solicitudes'
      });
    }

    const solicitud = await Vacaciones.findByPk(id, {
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] }
      ]
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar que el empleado sea el reemplazo
    if (solicitud.reemplazo_identificacion !== empleado?.documento) {
      return res.status(403).json({ message: 'No tienes permisos para dar visto bueno a esta solicitud' });
    }

    // Actualizar estado a aprobado
    await solicitud.update({
      estado: 'aprobado',
      fecha_revision: new Date(),
      revisado_por: empleadoId,
      observaciones: observaciones || `Visto bueno dado por ${empleado?.nombres}`
    });

    // Notificar al solicitante
    if (solicitud.empleado && solicitud.empleado.email) {
      try {
        const { getVacacionesAprobadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesAprobadaTemplate(solicitud.empleado, solicitud, empleado);
        await sendMail(solicitud.empleado.email, 'Solicitud de Vacaciones Aprobada', emailHTML);
        console.log('✅ Correo de notificación enviado al solicitante:', solicitud.empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }

    console.log(`✅ Visto bueno aprobado para solicitud ${id} por empleado ${empleadoId}`);
    res.json({ message: 'Visto bueno aprobado correctamente', solicitud });
  } catch (error) {
    console.error('Error al aprobar visto bueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar visto bueno de una solicitud
exports.rechazarVistoBueno = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo, observaciones } = req.body;
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;

    // Verificar que el empleado no sea jefe de área
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const empleado = await Empleado.findByPk(empleadoId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (empleado?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      console.log('❌ Jefe de área intentando rechazar visto bueno - Acceso denegado');
      return res.status(403).json({
        message: 'Los jefes de área no pueden rechazar visto bueno a las solicitudes'
      });
    }

    const solicitud = await Vacaciones.findByPk(id, {
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] }
      ]
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar que el empleado sea el reemplazo
    if (solicitud.reemplazo_identificacion !== empleado?.documento) {
      return res.status(403).json({ message: 'No tienes permisos para rechazar visto bueno a esta solicitud' });
    }

    // Actualizar estado a rechazado
    await solicitud.update({
      estado: 'rechazado',
      fecha_revision: new Date(),
      revisado_por: empleadoId,
      motivo_rechazo: motivo_rechazo || 'Rechazado por el reemplazo',
      observaciones: observaciones || `Visto bueno rechazado por ${empleado?.nombres}`
    });

    // Notificar al solicitante
    if (solicitud.empleado && solicitud.empleado.email) {
      try {
        const { getVacacionesRechazadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesRechazadaTemplate(solicitud.empleado, solicitud, empleado);
        await sendMail(solicitud.empleado.email, 'Solicitud de Vacaciones Rechazada', emailHTML);
        console.log('✅ Correo de notificación enviado al solicitante:', solicitud.empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }

    console.log(`❌ Visto bueno rechazado para solicitud ${id} por empleado ${empleadoId}`);
    res.json({ message: 'Visto bueno rechazado correctamente', solicitud });
  } catch (error) {
    console.error('Error al rechazar visto bueno:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud por Jefe de Área
exports.aprobarPorJefe = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    
    // Verificar que el usuario sea JEFE AREA
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    // Verificar que empleadoId no sea undefined
    if (!empleadoId) {
      console.error('❌ Error: empleadoId es undefined');
      console.error('req.usuario:', req.usuario);
      return res.status(400).json({ 
        message: 'No se pudo identificar al usuario que realiza la acción' 
      });
    }
    
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
    
    if (!usuario || !usuario.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      return res.status(403).json({ 
        message: 'Solo los jefes de área pueden aprobar solicitudes en este nivel' 
      });
    }
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: 'Solo se pueden aprobar solicitudes en estado pendiente' 
      });
    }
    
    await solicitud.update({
      estado: 'en_revision',
      observaciones,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        const { getVacacionesEnRevisionTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesEnRevisionTemplate(empleado, solicitud, usuario.empleado);
        await sendMail(
          empleado.email,
          '⏳ Solicitud de Vacaciones Aprobada por Jefe - Pendiente de Administración',
          emailHTML
        );
        console.log('✅ Correo de notificación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }
    
    // Notificar a administradores
    console.log('🔔 DEBUG: Notificando a jefes de área de ADMINISTRACIÓN...');
    await notificarAAdministradores(solicitud, 'jefe_aprobado');
    console.log('✅ DEBUG: Notificación a administradores completada');
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al aprobar por jefe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud por Administración
exports.aprobarPorAdministracion = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    
    // Verificar que el usuario sea ADMINISTRADOR o JEFE AREA de ADMINISTRACIÓN
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    // Verificar que empleadoId no sea undefined
    if (!empleadoId) {
      console.error('❌ Error: empleadoId es undefined');
      console.error('req.usuario:', req.usuario);
      return res.status(400).json({ 
        message: 'No se pudo identificar al usuario que realiza la acción' 
      });
    }
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    const usuario = await Usuario.findOne({
      where: { empleado_id: empleadoId },
      include: [
        {
          model: Rol,
          as: 'roles',
          attributes: ['nombre']
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    if (!usuario) {
      return res.status(403).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar si tiene permisos: ADMINISTRADOR o JEFE AREA de ADMINISTRACIÓN
    const esAdministrador = usuario.roles?.some(rol => rol.nombre === 'ADMINISTRADOR');
    const esJefeAreaAdmin = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA') && 
                           usuario.empleado?.areas?.[0]?.departamento?.id === 4; // ADMINISTRACIÓN
    
    if (!esAdministrador && !esJefeAreaAdmin) {
      return res.status(403).json({ 
        message: 'Solo los administradores o jefes de área de administración pueden aprobar solicitudes en este nivel' 
      });
    }
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'en_revision') {
      return res.status(400).json({ 
        message: 'Solo se pueden aprobar solicitudes en estado en_revision' 
      });
    }
    
    await solicitud.update({
      estado: 'aprobado_por_admin',
      observaciones,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        const { getVacacionesAprobadaPorAdminTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesAprobadaPorAdminTemplate(empleado, solicitud);
        await sendMail(
          empleado.email,
          '✅ Solicitud de Vacaciones Aprobada por Administración - Pendiente de RRHH',
          emailHTML
        );
        console.log('✅ Correo de notificación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }
    
    // Notificar a RRHH
    await notificarARRHH(solicitud, 'admin_aprobado');
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al aprobar por administración:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud por Administración
exports.rechazarPorAdministracion = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo } = req.body;
    
    // Verificar que el usuario sea ADMINISTRADOR o JEFE AREA de ADMINISTRACIÓN
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    // Verificar que empleadoId no sea undefined
    if (!empleadoId) {
      console.error('❌ Error: empleadoId es undefined');
      console.error('req.usuario:', req.usuario);
      return res.status(400).json({ 
        message: 'No se pudo identificar al usuario que realiza la acción' 
      });
    }
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    const usuario = await Usuario.findOne({
      where: { empleado_id: empleadoId },
      include: [
        {
          model: Rol,
          as: 'roles',
          attributes: ['nombre']
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    if (!usuario) {
      return res.status(403).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar si tiene permisos: ADMINISTRADOR o JEFE AREA de ADMINISTRACIÓN
    const esAdministrador = usuario.roles?.some(rol => rol.nombre === 'ADMINISTRADOR');
    const esJefeAreaAdmin = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA') && 
                           usuario.empleado?.areas?.[0]?.departamento?.id === 4; // ADMINISTRACIÓN
    
    if (!esAdministrador && !esJefeAreaAdmin) {
      return res.status(403).json({ 
        message: 'Solo los administradores o jefes de área de administración pueden rechazar solicitudes en este nivel' 
      });
    }
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'en_revision') {
      return res.status(400).json({ 
        message: 'Solo se pueden rechazar solicitudes en estado en_revision' 
      });
    }
    
    await solicitud.update({
      estado: 'rechazado',
      motivo_rechazo,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        await sendMail(
          empleado.email,
          '❌ Solicitud de Vacaciones Rechazada por Administración',
          `<p>Hola ${empleado.nombres},</p>
           <p>Tu solicitud de vacaciones ha sido rechazada por administración.</p>
           <p>Número de solicitud: ${solicitud.id}</p>
           <p>Motivo del rechazo: ${motivo_rechazo}</p>
           <p>Si tienes alguna pregunta, contacta a tu jefe de área.</p>`
        );
        console.log('✅ Correo de notificación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al rechazar por administración:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud por RRHH
exports.aprobarPorRRHH = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    
    console.log('🔍 DEBUG: aprobarPorRRHH iniciada');
    console.log('📋 Parámetros:', { id, observaciones });
    
    // Verificar que el usuario sea RRHH o JEFE AREA de RRHH
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    console.log('👤 req.usuario:', req.usuario);
    console.log('🆔 empleadoId:', empleadoId);
    
    // Verificar que empleadoId no sea undefined
    if (!empleadoId) {
      console.error('❌ Error: empleadoId es undefined');
      console.error('req.usuario:', req.usuario);
      return res.status(400).json({ 
        message: 'No se pudo identificar al usuario que realiza la acción' 
      });
    }
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    const usuario = await Usuario.findOne({
      where: { empleado_id: empleadoId },
      include: [
        {
          model: Rol,
          as: 'roles',
          attributes: ['nombre']
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    if (!usuario) {
      return res.status(403).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO');
    if (usuario) {
      console.log('🎭 Roles del usuario:', usuario.roles?.map(r => r.nombre));
      console.log('🏢 Áreas del usuario:', usuario.empleado?.areas?.map(a => ({
        area: a.nombre,
        departamento: a.departamento?.nombre,
        dept_id: a.departamento?.id
      })));
    }
    
    // Verificar si tiene permisos: RRHH o JEFE AREA de RRHH
    const esRRHH = usuario.roles?.some(rol => rol.nombre === 'RRHH');
    const esJefeAreaRRHH = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA') && 
                          usuario.empleado?.areas?.[0]?.departamento?.id === 2; // RRHH
    
    console.log('🔐 Verificación de permisos:');
    console.log('   - esRRHH:', esRRHH);
    console.log('   - esJefeAreaRRHH:', esJefeAreaRRHH);
    console.log('   - Tiene rol JEFE AREA:', usuario.roles?.some(rol => rol.nombre === 'JEFE AREA'));
    console.log('   - Departamento ID:', usuario.empleado?.areas?.[0]?.departamento?.id);
    console.log('   - Departamento nombre:', usuario.empleado?.areas?.[0]?.departamento?.nombre);
    
    if (!esRRHH && !esJefeAreaRRHH) {
      console.log('❌ Usuario no tiene permisos suficientes');
      return res.status(403).json({ 
        message: 'Solo el personal de RRHH o jefes de área de RRHH pueden aprobar solicitudes en este nivel' 
      });
    }
    
    console.log('✅ Usuario tiene permisos, continuando...');
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'aprobado_por_admin') {
      return res.status(400).json({ 
        message: 'Solo se pueden aprobar solicitudes en estado aprobado_por_admin' 
      });
    }
    
    await solicitud.update({
      estado: 'aprobado',
      observaciones,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado CON EL PDF FINAL
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    console.log('🔍 DEBUG: Empleado encontrado:', empleado?.nombres, empleado?.email);
    
    if (empleado && empleado.email) {
      try {
        const { getVacacionesAprobadaPorRRHHTemplate } = require('../../utils/emailTemplates');
        
        // Generar documento final desde Excel y convertir a PDF si es posible
        let pdfPath = null;
        try {
          console.log('📄 DEBUG: Generando documento desde Excel...');
          const { generarPDFVacacionesDesdeExcel } = require('../../utils/pdfFromExcel');

          const datos = {
            id: solicitud.id,
            ciudad_departamento: solicitud.ciudad_departamento,
            fecha_solicitud: solicitud.fecha_solicitud,
            nombres_colaborador: solicitud.nombres_colaborador,
            cedula_colaborador: solicitud.cedula_colaborador,
            cargo_colaborador: solicitud.cargo_colaborador,
            periodo_cumplido_desde: solicitud.periodo_cumplido_desde,
            periodo_cumplido_hasta: solicitud.periodo_cumplido_hasta,
            dias_cumplidos: solicitud.dias_cumplidos,
            periodo_disfrute_desde: solicitud.periodo_disfrute_desde,
            periodo_disfrute_hasta: solicitud.periodo_disfrute_hasta,
            dias_disfrute: solicitud.dias_disfrute,
            actividades_pendientes: solicitud.actividades_pendientes
          };

          const docResult = await generarPDFVacacionesDesdeExcel(datos);
          pdfPath = docResult.filePath;
          console.log('✅ Documento generado desde Excel:', docResult.fileName);
          console.log('📁 DEBUG: Ruta del adjunto:', pdfPath);
          
          // Verificar que el archivo existe
          const fs = require('fs');
          if (fs.existsSync(pdfPath)) {
            const stats = fs.statSync(pdfPath);
            console.log('✅ Archivo existe y tiene tamaño:', stats.size, 'bytes');
            
            // Guardar la ruta en archivo_pdf en la base de datos
            const relativePath = `pdfs/${path.basename(pdfPath)}`;
            await solicitud.update({ archivo_pdf: relativePath });
            console.log('✅ Ruta del formato oficial guardada en BD:', relativePath);
          } else {
            console.error('❌ ERROR: El archivo generado no existe:', pdfPath);
            pdfPath = null;
          }
        } catch (pdfError) {
          console.error('❌ Error generando documento desde Excel:', pdfError);
          console.error('❌ Stack trace:', pdfError.stack);
          pdfPath = null; // Asegurar que sea null si hay error
          // Continuar sin adjunto si falla la generación
        }
        
        // Enviar correo con PDF adjunto
        console.log('📧 DEBUG: Enviando correo...');
        console.log('📧 DEBUG: Email:', empleado.email);
        console.log('📧 DEBUG: PDF Path:', pdfPath || 'NINGUNO (se enviará sin adjunto)');
        
        // Solo enviar si tenemos un archivo válido
        if (!pdfPath) {
          console.warn('⚠️ ADVERTENCIA: No se generó el archivo PDF, se enviará correo sin adjunto');
        }
        
        await enviarCorreoConAdjunto(
          empleado.email,
          '🎉 Solicitud de Vacaciones Aprobada Completamente',
          getVacacionesAprobadaPorRRHHTemplate,
          empleado,
          null, // jefe no necesario para este template
          solicitud,
          pdfPath // ENVIAR PDF FINAL AL EMPLEADO
        );
        
        console.log('✅ Correo de notificación con PDF enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    } else {
      console.log('⚠️ DEBUG: Empleado no encontrado o sin email');
      console.log('🔍 DEBUG: empleado:', empleado);
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al aprobar por RRHH:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud por RRHH (Jefe de Área)
exports.rechazarPorRRHH = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo } = req.body;
    
    // Verificar que el usuario sea RRHH o JEFE AREA de RRHH
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;
    
    // Verificar que empleadoId no sea undefined
    if (!empleadoId) {
      console.error('❌ Error: empleadoId es undefined');
      console.error('req.usuario:', req.usuario);
      return res.status(400).json({ 
        message: 'No se pudo identificar al usuario que realiza la acción' 
      });
    }
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    const usuario = await Usuario.findOne({
      where: { empleado_id: empleadoId },
      include: [
        {
          model: Rol,
          as: 'roles',
          attributes: ['nombre']
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    if (!usuario) {
      return res.status(403).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar si tiene permisos: RRHH o JEFE AREA de RRHH
    const esRRHH = usuario.roles?.some(rol => rol.nombre === 'RRHH');
    const esJefeAreaRRHH = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA') && 
                          usuario.empleado?.areas?.[0]?.departamento?.id === 2; // RRHH
    
    if (!esRRHH && !esJefeAreaRRHH) {
      return res.status(403).json({ 
        message: 'Solo el personal de RRHH o jefes de área de RRHH pueden rechazar solicitudes en este nivel' 
      });
    }
    
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'aprobado_por_admin') {
      return res.status(400).json({ 
        message: 'Solo se pueden rechazar solicitudes en estado aprobado_por_admin' 
      });
    }
    
    await solicitud.update({
      estado: 'rechazado',
      motivo_rechazo,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        await sendMail(
          empleado.email,
          '❌ Solicitud de Vacaciones Rechazada por RRHH',
          `<p>Hola ${empleado.nombres},</p>
           <p>Tu solicitud de vacaciones ha sido rechazada por RRHH.</p>
           <p>Número de solicitud: ${solicitud.id}</p>
           <p>Motivo del rechazo: ${motivo_rechazo}</p>
           <p>Si tienes alguna pregunta, contacta a tu jefe de área.</p>`
        );
        console.log('✅ Correo de notificación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al rechazar por RRHH:', error);
    res.status(500).json({ error: error.message });
  }
};

// Función para notificar a administradores (jefes de área de ADMINISTRACIÓN)
// FLUJO CORRECTO: Cuando un jefe de área aprueba una solicitud de vacaciones,
// la notificación debe ir a los jefes de área de ADMINISTRACIÓN, no a RRHH.
// RRHH solo recibe notificación cuando ADMINISTRACIÓN aprueba la solicitud.
async function notificarAAdministradores(solicitud, tipo) {
  try {
    console.log('🔍 DEBUG: Iniciando notificarAAdministradores...');
    console.log('🔍 DEBUG: Tipo de notificación:', tipo);
    console.log('🔍 DEBUG: Solicitud ID:', solicitud?.id);
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    // Buscar el departamento ADMINISTRACIÓN y obtener su gerente_id
    console.log('🔍 DEBUG: Buscando departamento ADMINISTRACIÓN para obtener gerente_id...');
    const Departamento = require('../../models/EstructuraEmpresa/Departamento');
    const Area = require('../../models/EstructuraEmpresa/Area');
    
    const departamentoAdmin = await Departamento.findOne({
      where: { 
        [db.Sequelize.Op.or]: [
          { nombre: 'ADMINISTRACIÓN' },
          { nombre: 'ADMINISTRACION' },
          { nombre: { [db.Sequelize.Op.like]: '%ADMIN%' } }
        ]
      },
      attributes: ['id', 'nombre', 'gerente_id']
    });

    if (!departamentoAdmin) {
      console.log('⚠️  No se encontró el departamento de ADMINISTRACIÓN');
      return;
    }

    console.log('🔍 DEBUG: Departamento ADMINISTRACIÓN:', departamentoAdmin.nombre, 'ID:', departamentoAdmin.id, 'gerente_id:', departamentoAdmin.gerente_id);

    if (!departamentoAdmin.gerente_id) {
      console.log('⚠️  El departamento ADMINISTRACIÓN no tiene gerente_id definido');
      return;
    }

    // Obtener el empleado gerente por gerente_id
    const gerente = await Empleado.findByPk(departamentoAdmin.gerente_id);
    if (!gerente || !gerente.email) {
      console.log('⚠️  No se encontró el empleado gerente o no tiene email. gerente_id =', departamentoAdmin.gerente_id);
      return;
    }

    console.log('🔍 DEBUG: Gerente de ADMINISTRACIÓN:', gerente.nombres, 'Email:', gerente.email);

    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    console.log('🔍 DEBUG: Empleado solicitante:', empleado?.nombres);

    try {
      const { getVacacionesNotificarAdministracionTemplate } = require('../../utils/emailTemplates');
      const emailHTML = getVacacionesNotificarAdministracionTemplate(empleado, solicitud);
      await sendMail(
        gerente.email,
        '🆕 Nueva Solicitud de Vacaciones Pendiente de Aprobación - Administración',
        emailHTML
      );
      console.log('✅ Correo de notificación enviado al GERENTE de Administración:', gerente.email);
    } catch (mailError) {
      console.error('❌ Error al enviar correo al gerente de administración:', mailError);
    }

    // Resumen final
    console.log('🎯 RESUMEN: Notificación enviada únicamente al gerente de ADMINISTRACIÓN');
    
  } catch (error) {
    console.error('Error al notificar administradores:', error);
  }
}

// Función para notificar a RRHH (jefes de área de RRHH)
async function notificarARRHH(solicitud, tipo) {
  try {
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');

    // Buscar el departamento RECURSOS HUMANOS y obtener su gerente_id
    const Departamento = require('../../models/EstructuraEmpresa/Departamento');
    console.log('🔍 DEBUG: Buscando departamento RECURSOS HUMANOS para obtener gerente_id...');

    const departamentoRRHH = await Departamento.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { nombre: 'RECURSOS HUMANOS' },
          { nombre: { [db.Sequelize.Op.like]: '%RECURSOS%' } },
          { nombre: { [db.Sequelize.Op.like]: '%HUMANOS%' } }
        ]
      },
      attributes: ['id', 'nombre', 'gerente_id']
    });

    if (!departamentoRRHH) {
      console.log('⚠️  No se encontró el departamento de RECURSOS HUMANOS');
      return;
    }

    console.log('🔍 DEBUG: Departamento RRHH:', departamentoRRHH.nombre, 'ID:', departamentoRRHH.id, 'gerente_id:', departamentoRRHH.gerente_id);

    if (!departamentoRRHH.gerente_id) {
      console.log('⚠️  El departamento RECURSOS HUMANOS no tiene gerente_id definido');
      return;
    }

    // Obtener el empleado gerente por gerente_id
    const gerenteRRHH = await Empleado.findByPk(departamentoRRHH.gerente_id);
    if (!gerenteRRHH || !gerenteRRHH.email) {
      console.log('⚠️  No se encontró el empleado gerente de RRHH o no tiene email. gerente_id =', departamentoRRHH.gerente_id);
      return;
    }

    console.log('🔍 DEBUG: Gerente de RRHH:', gerenteRRHH.nombres, 'Email:', gerenteRRHH.email);

    const empleado = await Empleado.findByPk(solicitud.empleado_id);

    try {
      const { getVacacionesNotificarRRHHTemplate } = require('../../utils/emailTemplates');
      const emailHTML = getVacacionesNotificarRRHHTemplate(empleado, solicitud);
      await sendMail(
        gerenteRRHH.email,
        '🆕 Solicitud de Vacaciones Aprobada por Administración - Pendiente de RRHH',
        emailHTML
      );
      console.log('✅ Correo de notificación enviado al GERENTE de RRHH:', gerenteRRHH.email);
    } catch (mailError) {
      console.error('❌ Error al enviar correo al gerente de RRHH:', mailError);
    }
  } catch (error) {
    console.error('Error al notificar RRHH:', error);
  }
}

// Notificar al jefe del departamento cuando se crea una solicitud (SIN PDF)
async function notificarAJefe(solicitud, empleado, archivoPath = null) {
  try {
    console.log('🔍 DEBUG: Iniciando notificación al gerente del departamento...');
    console.log('🔍 DEBUG: Empleado:', empleado?.nombres);
    console.log('🔍 DEBUG: Solicitud ID:', solicitud?.id);
    console.log('🔍 DEBUG: Empleado ID:', empleado?.id);
    
    if (!empleado || !empleado.id) {
      console.log('❌ DEBUG: Empleado no válido o sin ID');
      return;
    }
    
    if (!solicitud || !solicitud.id) {
      console.log('❌ DEBUG: Solicitud no válida o sin ID');
      return;
    }
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const Area = require('../../models/EstructuraEmpresa/Area');
    const Departamento = require('../../models/EstructuraEmpresa/Departamento');

    console.log('🔍 DEBUG: Buscando empleado con áreas y departamento...');
    
    // Verificar si el empleado tiene área asignada en EmpleadoArea
    const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
    const areasAsignadas = await EmpleadoArea.findAll({
      where: { empleado_id: empleado.id }
    });
    
    console.log('🔍 DEBUG: Áreas asignadas en EmpleadoArea:', areasAsignadas.length);
    areasAsignadas.forEach((ea, index) => {
      console.log(`   ${index + 1}. Area ID: ${ea.area_id}`);
    });
    
    // Obtener el empleado con su área y departamento
    const empleadoCompleto = await Empleado.findByPk(empleado.id, {
      include: [
        {
          model: Area,
          as: 'areas',
          attributes: ['id', 'nombre'],
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['id', 'nombre', 'gerente_id']
            }
          ]
        }
      ]
    });

    console.log('🔍 DEBUG: Empleado encontrado:', empleadoCompleto ? 'SÍ' : 'NO');
    console.log('🔍 DEBUG: Áreas del empleado:', empleadoCompleto?.areas?.length || 0);
    
    if (empleadoCompleto?.areas?.length > 0) {
      console.log('🔍 DEBUG: Primera área:', empleadoCompleto.areas[0].nombre);
      console.log('🔍 DEBUG: Departamento de la primera área:', empleadoCompleto.areas[0].departamento?.nombre);
      console.log('🔍 DEBUG: Gerente ID del departamento:', empleadoCompleto.areas[0].departamento?.gerente_id);
    }

    if (!empleadoCompleto?.areas?.[0]?.departamento) {
      console.log('⚠️ DEBUG: Empleado no tiene departamento asignado');
      return;
    }

    const departamento = empleadoCompleto.areas[0].departamento;
    console.log('🔍 DEBUG: Departamento del empleado:', departamento.nombre);
    console.log('🔍 DEBUG: Gerente ID del departamento:', departamento.gerente_id);

    if (!departamento.gerente_id) {
      console.log('⚠️ DEBUG: El departamento no tiene gerente asignado');
      return;
    }

    console.log('🔍 DEBUG: Buscando gerente con ID:', departamento.gerente_id);
    
    // Buscar al gerente del departamento
    const gerente = await Empleado.findByPk(departamento.gerente_id);
    
    console.log('🔍 DEBUG: Gerente encontrado:', gerente ? 'SÍ' : 'NO');
    
    if (!gerente) {
      console.log('⚠️ DEBUG: No se encontró al gerente del departamento');
      return;
    }

    console.log('🔍 DEBUG: Gerente encontrado:', gerente.nombres);
    console.log('🔍 DEBUG: Email del gerente:', gerente.email);

    if (gerente.email) {
      try {
        console.log('✅ DEBUG: Enviando notificación al gerente del departamento:', gerente.email);
        console.log('🔍 DEBUG: Gerente:', gerente.nombres);
        console.log('🔍 DEBUG: Departamento:', departamento.nombre);
        
        // NO enviar PDF al gerente - solo notificación
        console.log('📎 DEBUG: No se envía PDF al gerente (solo notificación)');
        
        const { getVacacionesNuevaSolicitudTemplate } = require('../../utils/emailTemplates');
        
        console.log('🔍 DEBUG: Plantilla importada correctamente');
        
        await enviarCorreoConAdjunto(
          gerente.email,
          '🆕 Nueva Solicitud de Vacaciones Pendiente de Aprobación',
          getVacacionesNuevaSolicitudTemplate,
          empleado,
          gerente,
          solicitud,
          null // NO enviar PDF al gerente
        );
        
        console.log('✅ Notificación enviada exitosamente al gerente del departamento:', gerente.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo al gerente del departamento:', mailError);
        console.error('❌ Detalles del error:', mailError.message);
      }
    } else {
      console.log('⚠️ DEBUG: Gerente del departamento no tiene email configurado:', gerente.nombres);
    }
  } catch (error) {
    console.error('❌ Error al notificar al gerente del departamento:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Rechazar por jefe de área
exports.rechazarPorJefe = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo, observaciones } = req.body;
    const empleadoId = req.usuario?.empleado?.id || req.usuario?.id;

    // Verificar que el empleado sea jefe de área
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const empleado = await Empleado.findByPk(empleadoId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    // Verificar si el usuario tiene roles de supervisión
    const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
    const tieneRolSupervision = empleado?.usuario?.roles?.some(rol => rolesSupervision.includes(rol.nombre));
    
    if (!tieneRolSupervision) {
      console.log('❌ Empleado no tiene roles de supervisión - Acceso denegado');
      console.log('Roles del empleado:', empleado?.usuario?.roles?.map(rol => rol.nombre) || 'Sin roles');
      return res.status(403).json({
        message: 'Solo los jefes de área, gerentes, administradores y super administradores pueden rechazar solicitudes'
      });
    }

    const solicitud = await Vacaciones.findByPk(id, {
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] }
      ]
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar que el empleado sea jefe del área del solicitante
    const empleadoSolicitante = await Empleado.findByPk(solicitud.empleado_id);
    if (empleadoSolicitante?.jefe_id !== empleadoId) {
      return res.status(403).json({ message: 'No tienes permisos para rechazar esta solicitud' });
    }

    // Actualizar estado a rechazado
    await solicitud.update({
      estado: 'rechazado',
      fecha_revision: new Date(),
      revisado_por: empleadoId,
      motivo_rechazo: motivo_rechazo || 'Rechazado por jefe de área',
      observaciones: observaciones || `Rechazado por jefe de área: ${empleado?.nombres}`
    });

    // Notificar al solicitante
    if (solicitud.empleado && solicitud.empleado.email) {
      try {
        const { getVacacionesRechazadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesRechazadaTemplate(solicitud.empleado, solicitud, empleado);
        await sendMail(solicitud.empleado.email, 'Solicitud de Vacaciones Rechazada', emailHTML);
        console.log('✅ Correo de notificación enviado al solicitante:', solicitud.empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }

    console.log(`❌ Solicitud ${id} rechazada por jefe de área ${empleadoId}`);
    res.json({ message: 'Solicitud rechazada por jefe de área', solicitud });
  } catch (error) {
    console.error('Error al rechazar por jefe:', error);
    res.status(500).json({ error: error.message });
  }
}; 

// Listar solicitudes por jefe de área
exports.listarVacacionesPorJefe = async (req, res) => {
  try {
    // Usar jefeId desde query params en lugar de req.user
    const jefeId = req.query.jefeId || req.usuario?.empleado?.id || req.usuario?.id;
    console.log('🔍 DEBUG: jefeId =', jefeId);
    
    if (!jefeId) {
      return res.status(400).json({ 
        message: 'Se requiere jefeId como parámetro de consulta' 
      });
    }
    
    // Verificar que el usuario sea jefe de área
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const jefe = await Empleado.findByPk(jefeId, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          include: [
            {
              model: Rol,
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    // Verificar si el usuario tiene roles de supervisión (jefe, gerente, administrador, super admin)
    const rolesSupervision = ['JEFE AREA', 'GERENTE', 'ADMINISTRADOR', 'SUPER ADMIN'];
    const tieneRolSupervision = jefe?.usuario?.roles?.some(rol => rolesSupervision.includes(rol.nombre));
    
    if (!tieneRolSupervision) {
      console.log('❌ Usuario no tiene roles de supervisión - Acceso denegado');
      console.log('Roles del usuario:', jefe?.usuario?.roles?.map(rol => rol.nombre) || 'Sin roles');
      return res.status(403).json({
        message: 'Solo los jefes de área, gerentes, administradores y super administradores pueden acceder a esta función'
      });
    }

    // Obtener las áreas donde este empleado es jefe
    const Area = require('../../models/EstructuraEmpresa/Area');
    const Departamento = require('../../models/EstructuraEmpresa/Departamento');
    
    // Obtener áreas del jefe con información del departamento
    const areasJefe = await Area.findAll({
      where: { jefe_id: jefeId },
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id', 'nombre']
        }
      ],
      attributes: ['id', 'nombre', 'departamento_id']
    });

    if (areasJefe.length === 0) {
      console.log(`📋 Jefe ${jefeId} no tiene áreas asignadas`);
      return res.json([]);
    }

    console.log(`📋 Jefe ${jefeId} gestiona las siguientes áreas:`);
    areasJefe.forEach(area => {
      console.log(`   - ${area.nombre} (Departamento: ${area.departamento?.nombre || 'N/A'})`);
    });

    const areasIds = areasJefe.map(area => area.id);

    // Obtener empleados que pertenecen a las áreas del jefe
    const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
    const empleadosAreas = await EmpleadoArea.findAll({
      where: { area_id: areasIds },
      attributes: ['empleado_id']
    });

    const empleadosIds = empleadosAreas.map(ea => ea.empleado_id);

    if (empleadosIds.length === 0) {
      console.log(`📋 Jefe ${jefeId} no tiene empleados a cargo`);
      return res.json([]);
    }

    console.log(`📋 Empleados a cargo del jefe ${jefeId}: ${empleadosIds.length}`);

    // Buscar solicitudes de los empleados a cargo
    const solicitudes = await Vacaciones.findAll({
      where: { 
        empleado_id: empleadosIds,
        deleted_at: null 
      },
      include: [
        { 
          model: Empleado, 
          as: 'empleado', 
          attributes: ['id', 'nombres', 'documento', 'email'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        },
        { model: Empleado, as: 'revisor', attributes: ['id', 'nombres', 'documento'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📋 Encontradas ${solicitudes.length} solicitudes para jefe ${jefeId}`);
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes por jefe:', error);
    res.status(500).json({ error: error.message });
  }
}; 

// Aprobar por Administrador
exports.aprobarPorAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    
    // Verificar que el usuario sea administrador
    if (!req.usuario?.roles?.some(rol => rol.nombre === 'ADMIN')) {
      return res.status(403).json({
        message: 'Solo los administradores pueden aprobar solicitudes en esta etapa'
      });
    }

    const vacacion = await Vacaciones.findByPk(id, {
      include: [{ model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'email'] }]
    });

    if (!vacacion) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (vacacion.estado !== 'en_revision') {
      return res.status(400).json({ 
        message: 'La solicitud debe estar en estado "en_revision" para ser aprobada por administrador' 
      });
    }

    // Actualizar estado
    await vacacion.update({
      estado: 'aprobado_por_admin',
      fecha_revision: new Date(),
      revisado_por: req.usuario.nombres || req.usuario?.empleado?.nombres,
      observaciones: observaciones || vacacion.observaciones
    });

    // Notificar al empleado
    if (vacacion.empleado?.email) {
      try {
        const { getVacacionesAprobadaPorAdminTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getVacacionesAprobadaPorAdminTemplate(vacacion.empleado, vacacion);
        await sendMail(vacacion.empleado.email, 'Solicitud de Vacaciones Aprobada por Administrador', emailHTML);
      } catch (mailError) {
        console.error('Error al enviar correo:', mailError);
      }
    }

    res.json({ 
      message: 'Solicitud aprobada por administrador correctamente',
      vacacion 
    });
  } catch (error) {
    console.error('Error al aprobar por administrador:', error);
    res.status(500).json({ error: error.message });
  }
};

// Duplicado eliminado: aprobarPorRRHH

// Listar solicitudes por estado para diferentes roles
exports.listarPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const user = req.usuario;

    let whereClause = { deleted_at: null };
    
    // Filtrar por estado si se especifica
    if (estado && estado !== 'todos') {
      whereClause.estado = estado;
    }

    // Filtrar según el rol del usuario
    if (user?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      // Jefes ven solicitudes de su equipo
      const areas = await require('../../models/EstructuraEmpresa/Area').findAll({
        where: { jefe_id: user.empleado?.id }
      });
      const areaIds = areas.map(area => area.id);
      const empleadosAreas = await require('../../models/EstructuraEmpresa/EmpleadosAreas').findAll({
        where: { area_id: areaIds }
      });
      const empleadoIds = empleadosAreas.map(ea => ea.empleado_id);
      whereClause.empleado_id = { [require('sequelize').Op.in]: empleadoIds };
    } else if (!user?.roles?.some(rol => rol.nombre === 'ADMIN')) {
      // Empleados normales ven solo sus solicitudes
      whereClause.empleado_id = user?.empleado?.id || user?.id;
    }

    const solicitudes = await Vacaciones.findAll({
      where: whereClause,
      include: [
        { model: Empleado, as: 'empleado', attributes: ['id', 'nombres', 'documento', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar por estado:', error);
    res.status(500).json({ error: error.message });
  }
}; 

// Función para descargar archivo PDF (formato oficial desde Excel)
exports.descargarPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la solicitud
    const solicitud = await Vacaciones.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    const pathProyecto = path.resolve(__dirname, '../../');
    const pdfsDir = path.join(pathProyecto, 'pdfs');
    let rutaArchivo = null;
    
    // SIEMPRE generar el formato desde Excel con información actualizada del estado
    // Esto asegura que las firmas reflejen el estado actual de aprobación
    // Esto asegura que las firmas reflejen el estado actual de aprobación
    console.log(`📄 Generando formato oficial desde Excel con estado actual...`);
    console.log(`📊 Estado actual de la solicitud: ${solicitud.estado}`);
    
    try {
      const { generarPDFVacacionesDesdeExcel } = require('../../utils/pdfFromExcel');
      
      // Obtener información del empleado y aprobadores
      const empleado = await Empleado.findByPk(solicitud.empleado_id);
      let jefe = null;
      let administrador = null;
      let rrhh = null;
      
      // Obtener jefe del área
      if (empleado) {
        const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
        const Area = require('../../models/EstructuraEmpresa/Area');
        const empleadoArea = await EmpleadoArea.findOne({
          where: { empleado_id: empleado.id },
          include: [{
            model: Area,
            as: 'area',
            attributes: ['jefe_id']
          }]
        });
        
        if (empleadoArea?.area?.jefe_id) {
          jefe = await Empleado.findByPk(empleadoArea.area.jefe_id);
        }
      }
      
      // Obtener información de quien aprobó (si existe)
      if (solicitud.revisado_por) {
        const revisor = await Empleado.findByPk(solicitud.revisado_por);
        if (revisor) {
          // Determinar si es administrador o RRHH según el estado
          if (solicitud.estado === 'aprobado_por_admin') {
            administrador = revisor;
          } else if (solicitud.estado === 'aprobado') {
            rrhh = revisor;
          }
        }
      }
      
      const datos = {
        id: solicitud.id,
        estado: solicitud.estado,
        ciudad_departamento: solicitud.ciudad_departamento,
        fecha_solicitud: solicitud.fecha_solicitud,
        nombres_colaborador: solicitud.nombres_colaborador,
        cedula_colaborador: solicitud.cedula_colaborador,
        cargo_colaborador: solicitud.cargo_colaborador,
        periodo_cumplido_desde: solicitud.periodo_cumplido_desde,
        periodo_cumplido_hasta: solicitud.periodo_cumplido_hasta,
        dias_cumplidos: solicitud.dias_cumplidos,
        periodo_disfrute_desde: solicitud.periodo_disfrute_desde,
        periodo_disfrute_hasta: solicitud.periodo_disfrute_hasta,
        dias_disfrute: solicitud.dias_disfrute,
        actividades_pendientes: solicitud.actividades_pendientes,
        // Información de aprobaciones
        empleado: empleado,
        jefe: jefe,
        administrador: administrador,
        rrhh: rrhh
      };
      
      const docResult = await generarPDFVacacionesDesdeExcel(datos);
      
      // Verificar que el resultado tenga filePath
      if (!docResult || !docResult.filePath) {
        throw new Error('La función generarPDFVacacionesDesdeExcel no retornó un filePath válido');
      }
      
      rutaArchivo = docResult.filePath;
      console.log(`✅ Formato oficial generado: ${rutaArchivo}`);
      
      // Verificar que el archivo realmente existe
      if (!fs.existsSync(rutaArchivo)) {
        console.error(`❌ ERROR: El archivo generado no existe: ${rutaArchivo}`);
        throw new Error(`El archivo generado no existe: ${rutaArchivo}`);
      }
      
      const stats = fs.statSync(rutaArchivo);
      console.log(`📊 Archivo generado existe, tamaño: ${stats.size} bytes`);
      
      // Guardar la ruta en archivo_pdf
      const relativePath = `pdfs/${path.basename(rutaArchivo)}`;
      await solicitud.update({ archivo_pdf: relativePath });
      console.log(`✅ Ruta guardada en BD: ${relativePath}`);
    } catch (pdfError) {
      console.error('❌ Error generando formato desde Excel:', pdfError);
      console.error('❌ Stack trace:', pdfError.stack);
      console.error('❌ Mensaje de error:', pdfError.message);
      
      // Si hay un error crítico, intentar buscar archivo adjunto como fallback
      console.log(`🔍 Intentando buscar archivo adjunto como fallback...`);
      if (solicitud.archivo_pdf) {
        let rutaTemporal = solicitud.archivo_pdf;
        
        if (path.isAbsolute(rutaTemporal)) {
          rutaArchivo = rutaTemporal;
        } else {
          rutaTemporal = rutaTemporal.replace(/^\/+/, '').replace(/\\/g, '/');
          
          if (rutaTemporal.startsWith('pdfs/')) {
            rutaArchivo = path.join(pathProyecto, rutaTemporal);
          } else if (rutaTemporal.startsWith('uploads/')) {
            rutaArchivo = path.join(pathProyecto, rutaTemporal);
          } else {
            rutaArchivo = path.join(pathProyecto, 'uploads', 'vacaciones', path.basename(rutaTemporal));
          }
        }
        
        if (fs.existsSync(rutaArchivo)) {
          console.log(`✅ Archivo adjunto encontrado como fallback: ${rutaArchivo}`);
        } else {
          console.log(`❌ Archivo adjunto no encontrado: ${rutaArchivo}`);
          rutaArchivo = null;
        }
      }
      
      // Si aún no hay archivo después del fallback, retornar error detallado
      if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
        console.error(`❌ No se pudo generar ni encontrar archivo para la solicitud ${id}`);
        return res.status(500).json({ 
          message: 'Error al generar el formato oficial. Por favor, contacte al administrador.',
          error: pdfError.message,
          detalles: 'No se pudo generar el PDF desde Excel y no se encontró archivo adjunto'
        });
      }
    }
    
    // Verificación final antes de enviar
    if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
      console.error(`❌ ERROR CRÍTICO: No hay archivo válido para enviar`);
      return res.status(500).json({ 
        message: 'Error al preparar el archivo para descarga. Por favor, contacte al administrador.'
      });
    }
    
    console.log(`✅ Archivo encontrado, enviando: ${rutaArchivo}`);
    
    // Verificar el tipo de archivo leyendo los primeros bytes para validar
    // Esto es CRÍTICO porque el contenido real puede diferir de la extensión
    const fileBuffer = fs.readFileSync(rutaArchivo);
    
    // Verificar magic numbers (firmas de archivo)
    const esPDF = fileBuffer.length >= 4 && 
                  fileBuffer[0] === 0x25 && // %
                  fileBuffer[1] === 0x50 && // P
                  fileBuffer[2] === 0x44 && // D
                  fileBuffer[3] === 0x46;   // F
    
    const esXLSX = fileBuffer.length >= 4 && 
                   fileBuffer[0] === 0x50 && // P
                   fileBuffer[1] === 0x4B && // K
                   fileBuffer[2] === 0x03 && 
                   fileBuffer[3] === 0x04;   // PK (ZIP/XLSX signature)
    
    console.log(`🔍 Magic numbers detectados:`, {
      bytes: Array.from(fileBuffer.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '),
      esPDF,
      esXLSX
    });
    
    // También verificar por extensión como fallback
    const extension = path.extname(rutaArchivo).toLowerCase();
    const esPDFPorExtension = extension === '.pdf';
    const esXLSXPorExtension = extension === '.xlsx';
    
    const tipoArchivo = (esPDF || esPDFPorExtension) ? 'PDF' : (esXLSX || esXLSXPorExtension) ? 'XLSX' : 'DESCONOCIDO';
    
    console.log(`📄 Tipo de archivo detectado: ${tipoArchivo}`);
    console.log(`📄 Por contenido: PDF=${esPDF}, XLSX=${esXLSX}`);
    console.log(`📄 Por extensión: PDF=${esPDFPorExtension}, XLSX=${esXLSXPorExtension}`);
    
    // Determinar el nombre del archivo y tipo de contenido
    // PRIORIZAR la detección por contenido sobre la extensión
    let nombreArchivo;
    let contentType;
    let archivoFinal = rutaArchivo; // Inicializar con la ruta original
    
    if (esPDF) {
      // Es un PDF válido por contenido
      nombreArchivo = `formato_vacaciones_${id}.pdf`;
      contentType = 'application/pdf';
      console.log('✅ Archivo es PDF válido (detectado por contenido)');
    } else if (esXLSX) {
      // Es un XLSX válido por contenido (aunque tenga extensión .pdf)
      nombreArchivo = `formato_vacaciones_${id}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      console.log('✅ Archivo es XLSX válido (detectado por contenido, corrigiendo extensión)');
      
      // Si el archivo tiene extensión .pdf pero es XLSX, buscar el XLSX original
      if (extension === '.pdf') {
        const xlsxPath = rutaArchivo.replace(/\.pdf$/i, '.xlsx');
        if (fs.existsSync(xlsxPath)) {
          console.log('📄 Usando XLSX original en lugar del archivo con extensión incorrecta:', xlsxPath);
          archivoFinal = xlsxPath;
          fileBuffer = fs.readFileSync(archivoFinal);
        }
      }
    } else if (extension === '.xlsx') {
      // Tiene extensión .xlsx
      nombreArchivo = `formato_vacaciones_${id}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      console.log('✅ Archivo es XLSX (detectado por extensión)');
    } else if (extension === '.pdf') {
      // Tiene extensión .pdf pero no es PDF válido
      // Intentar buscar el XLSX original
      const xlsxPath = rutaArchivo.replace(/\.pdf$/i, '.xlsx');
      if (fs.existsSync(xlsxPath)) {
        console.log('⚠️ Archivo con extensión .pdf no es PDF válido, usando XLSX original:', xlsxPath);
        archivoFinal = xlsxPath;
        fileBuffer = fs.readFileSync(archivoFinal);
        nombreArchivo = `formato_vacaciones_${id}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        // Si no hay XLSX, intentar como PDF de todas formas
        nombreArchivo = `formato_vacaciones_${id}.pdf`;
        contentType = 'application/pdf';
        console.warn('⚠️ Archivo tiene extensión .pdf pero no es PDF válido, enviando como PDF');
      }
    } else {
      // Si no se puede determinar, usar extensión
      nombreArchivo = `formato_vacaciones_${id}${extension || ''}`;
      contentType = 'application/octet-stream';
      console.warn('⚠️ No se pudo determinar el tipo de archivo, usando extensión:', extension);
    }
    
    // Usar el archivo final (puede ser diferente de rutaArchivo si se cambió a XLSX)
    const rutaAbsolutaFinal = path.resolve(archivoFinal);
    console.log(`📤 Archivo final a enviar: ${archivoFinal}`);
    console.log(`📤 Ruta absoluta: ${rutaAbsolutaFinal}`);
    console.log(`📤 Nombre archivo: ${nombreArchivo}`);
    console.log(`📤 Content-Type: ${contentType}`);
    
    // Verificar nuevamente que el archivo existe antes de enviarlo
    if (!fs.existsSync(rutaAbsolutaFinal)) {
      console.error('❌ ERROR: El archivo no existe en la ruta absoluta:', rutaAbsolutaFinal);
      return res.status(500).json({ 
        error: 'El archivo no existe en el servidor' 
      });
    }
    
    // Obtener estadísticas del archivo final
    const statsFinal = fs.statSync(rutaAbsolutaFinal);
    if (statsFinal.size === 0) {
      console.error('❌ ERROR: El archivo está vacío');
      return res.status(500).json({ 
        error: 'El archivo está vacío' 
      });
    }
    
    console.log(`📊 Tamaño final del archivo a enviar: ${statsFinal.size} bytes`);
    
    // Configurar headers ANTES de enviar
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nombreArchivo)}"`);
    res.setHeader('Content-Length', statsFinal.size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Enviar el archivo usando sendFile
    res.sendFile(rutaAbsolutaFinal, (err) => {
      if (err) {
        console.error('❌ Error al enviar archivo:', err);
        console.error('❌ Stack trace:', err.stack);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Error al descargar el archivo',
            detalles: err.message 
          });
        }
      } else {
        console.log('✅ Archivo enviado exitosamente');
      }
    });
    
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ error: error.message });
  }
};