const models = require('../../models');
const Cesantias = models.Cesantias;
const Empleado = models.Empleado;
const { sendMail } = require('../../utils/mailer');
const db = require('../../config/database');

// Crear nueva solicitud de cesantías
exports.crearCesantias = async (req, res) => {
  const t = await db.transaction();
  try {
    console.log('--- INICIO crearCesantias ---');
    console.log('Datos recibidos para crear solicitud de cesantías:', req.body);

    // Verificar que el usuario no sea jefe de área
    const empleadoVerificacion = await Empleado.findOne({
      where: { id: req.body.empleado_id },
      include: [
        {
          model: require('../../models/Usuario'),
          as: 'usuario',
          include: [
            {
              model: require('../../models/Rol'),
              as: 'roles',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    if (empleadoVerificacion?.usuario?.roles?.some(rol => rol.nombre === 'JEFE AREA')) {
      console.log('❌ Jefe de área intentando crear solicitud de cesantías - Acceso denegado');
      return res.status(403).json({
        message: 'Los jefes de área no pueden crear solicitudes de cesantías desde la interfaz de gestión. Deben hacerlo desde su cuenta personal de empleado.'
      });
    }

    // Validar campos obligatorios
    const camposObligatorios = [
      'empleado_id', 'correo_solicitante', 'nombre_colaborador', 
      'fecha_solicitud', 'tipo_retiro'
    ];
    
    for (const campo of camposObligatorios) {
      if (!req.body[campo]) {
        console.error(`Falta el campo obligatorio: ${campo}`);
        return res.status(400).json({ error: `Falta el campo obligatorio: ${campo}` });
      }
    }

    // Validar tipo de retiro y datos bancarios
    if (req.body.tipo_retiro === 'consignacion_cuenta') {
      const camposBancarios = ['entidad_bancaria', 'tipo_cuenta', 'numero_cuenta'];
      for (const campo of camposBancarios) {
        if (!req.body[campo]) {
          return res.status(400).json({ error: `Para consignación en cuenta bancaria, el campo ${campo} es obligatorio` });
        }
      }
    }

    // Crear la solicitud
    const nuevaSolicitud = await Cesantias.create(req.body, { transaction: t });
    console.log('Solicitud de cesantías creada:', nuevaSolicitud);

    // Buscar al empleado
    const empleado = await Empleado.findByPk(req.body.empleado_id);
    if (empleado && empleado.email) {
      try {
        const { getCesantiasCreadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getCesantiasCreadaTemplate(empleado, nuevaSolicitud);
        
        await sendMail(
          empleado.email,
          '✨ Solicitud de Cesantías Creada - Portal UCI',
          emailHTML
        );
        console.log('✅ Correo de confirmación enviado a:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de confirmación:', mailError);
      }
    }

    await t.commit();
    console.log('--- FIN crearCesantias (éxito) ---');
    res.status(201).json(nuevaSolicitud);
  } catch (error) {
    await t.rollback();
    console.error('Error en crearCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar todas las solicitudes (no eliminadas)
exports.listarCesantias = async (req, res) => {
  try {
    const solicitudes = await Cesantias.findAll({ 
      where: { deleted_at: null },
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        },
        {
          model: Empleado,
          as: 'revisor',
          attributes: ['id', 'nombres', 'documento']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error en listarCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes de un empleado específico
exports.listarCesantiasEmpleado = async (req, res) => {
  try {
    const { empleado_id } = req.params;
    const solicitudes = await Cesantias.findAll({ 
      where: { 
        empleado_id: empleado_id,
        deleted_at: null 
      },
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        },
        {
          model: Empleado,
          as: 'revisor',
          attributes: ['id', 'nombres', 'documento']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error en listarCesantiasEmpleado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener una solicitud por ID
exports.obtenerCesantias = async (req, res) => {
  try {
    const solicitud = await Cesantias.findByPk(req.params.id, {
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        },
        {
          model: Empleado,
          as: 'revisor',
          attributes: ['id', 'nombres', 'documento']
        }
      ]
    });
    
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    res.json(solicitud);
  } catch (error) {
    console.error('Error en obtenerCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una solicitud
exports.actualizarCesantias = async (req, res) => {
  try {
    const solicitud = await Cesantias.findByPk(req.params.id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    await solicitud.update(req.body);
    
    // Si se cambió el estado, enviar notificación
    if (req.body.estado && req.body.estado !== solicitud.estado) {
      const empleado = await Empleado.findByPk(solicitud.empleado_id);
      if (empleado && empleado.email) {
        try {
          const { getCesantiasCambioEstadoTemplate } = require('../../utils/emailTemplates');
          const emailHTML = getCesantiasCambioEstadoTemplate(empleado, solicitud, solicitud.estado, req.body.estado);
          
          await sendMail(
            empleado.email,
            `🔄 Estado de Solicitud de Cesantías Actualizado - Portal UCI`,
            emailHTML
          );
          console.log('✅ Correo de cambio de estado enviado a:', empleado.email);
        } catch (mailError) {
          console.error('❌ Error al enviar correo de cambio de estado:', mailError);
        }
      }
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error en actualizarCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminado lógico
exports.eliminarCesantias = async (req, res) => {
  try {
    const solicitud = await Cesantias.findByPk(req.params.id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    await solicitud.destroy();
    res.json({ message: 'Solicitud eliminada correctamente (lógico)' });
  } catch (error) {
    console.error('Error en eliminarCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar solicitudes por estado
exports.listarCesantiasPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const solicitudes = await Cesantias.findAll({ 
      where: { 
        estado: estado,
        deleted_at: null 
      },
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'documento', 'email']
        },
        {
          model: Empleado,
          as: 'revisor',
          attributes: ['id', 'nombres', 'documento']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error en listarCesantiasPorEstado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar solicitud - Solo jefes de área de RRHH
exports.aprobarCesantias = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto_aprobado, observaciones } = req.body;
    
    // Verificar que el usuario sea JEFE AREA de RRHH
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
    const Area = require('../../models/Area');
    const Departamento = require('../../models/Departamento');
    
    // Verificar que el usuario sea jefe de área de RRHH
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
          include: [
            {
              model: Area,
              as: 'areas',
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
    
    // Verificar que tenga rol JEFE AREA
    const tieneRolJefeArea = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA');
    if (!tieneRolJefeArea) {
      return res.status(403).json({ 
        message: 'Solo los jefes de área pueden aprobar solicitudes de cesantías' 
      });
    }
    
    // Verificar que sea del departamento RRHH
    const esDeRRHH = usuario.empleado?.areas?.[0]?.departamento?.nombre === 'RECURSOS HUMANOS';
    if (!esDeRRHH) {
      return res.status(403).json({ 
        message: 'Solo los jefes de área de Recursos Humanos pueden aprobar solicitudes de cesantías' 
      });
    }
    
    const solicitud = await Cesantias.findByPk(id);
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
      monto_aprobado,
      observaciones,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        const { getCesantiasAprobadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getCesantiasAprobadaTemplate(empleado, solicitud);
        
        await sendMail(
          empleado.email,
          '✅ Solicitud de Cesantías Aprobada - Portal UCI',
          emailHTML
        );
        console.log('✅ Correo de aprobación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de aprobación:', mailError);
      }
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error en aprobarCesantias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar solicitud - Solo jefes de área de RRHH
exports.rechazarCesantias = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo, observaciones } = req.body;
    
    if (!motivo_rechazo) {
      return res.status(400).json({ error: 'El motivo del rechazo es obligatorio' });
    }
    
    // Verificar que el usuario sea JEFE AREA de RRHH
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
    const Area = require('../../models/Area');
    const Departamento = require('../../models/Departamento');
    
    // Verificar que el usuario sea jefe de área de RRHH
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
          include: [
            {
              model: Area,
              as: 'areas',
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
    
    // Verificar que tenga rol JEFE AREA
    const tieneRolJefeArea = usuario.roles?.some(rol => rol.nombre === 'JEFE AREA');
    if (!tieneRolJefeArea) {
      return res.status(403).json({ 
        message: 'Solo los jefes de área pueden rechazar solicitudes de cesantías' 
      });
    }
    
    // Verificar que sea del departamento RRHH
    const esDeRRHH = usuario.empleado?.areas?.[0]?.departamento?.nombre === 'RECURSOS HUMANOS';
    if (!esDeRRHH) {
      return res.status(403).json({ 
        message: 'Solo los jefes de área de Recursos Humanos pueden rechazar solicitudes de cesantías' 
      });
    }
    
    const solicitud = await Cesantias.findByPk(id);
    if (!solicitud || solicitud.deleted_at) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ 
        message: 'Solo se pueden rechazar solicitudes en estado pendiente' 
      });
    }
    
    await solicitud.update({
      estado: 'rechazado',
      motivo_rechazo,
      observaciones,
      revisado_por: empleadoId,
      fecha_revision: new Date()
    });
    
    // Enviar notificación al empleado
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    if (empleado && empleado.email) {
      try {
        const { getCesantiasRechazadaTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getCesantiasRechazadaTemplate(empleado, solicitud);
        
        await sendMail(
          empleado.email,
          '❌ Solicitud de Cesantías Rechazada - Portal UCI',
          emailHTML
        );
        console.log('✅ Correo de rechazo enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de rechazo:', mailError);
      }
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error en rechazarCesantias:', error);
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
    
    const solicitud = await Cesantias.findByPk(id);
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
        const { getCesantiasCambioEstadoTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getCesantiasCambioEstadoTemplate(empleado, solicitud, 'pendiente', 'en_revision');
        await sendMail(
          empleado.email,
          '⏳ Solicitud de Cesantías Aprobada por Jefe - Pendiente de Administración',
          emailHTML
        );
        console.log('✅ Correo de notificación enviado al empleado:', empleado.email);
      } catch (mailError) {
        console.error('❌ Error al enviar correo de notificación:', mailError);
      }
    }
    
    // Notificar a administradores
    await notificarAAdministradores(solicitud, 'jefe_aprobado');
    
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
    
    const solicitud = await Cesantias.findByPk(id);
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
        const { getCesantiasCambioEstadoTemplate } = require('../../utils/emailTemplates');
        const emailHTML = getCesantiasCambioEstadoTemplate(empleado, solicitud, 'en_revision', 'aprobado_por_admin');
        await sendMail(
          empleado.email,
          '✅ Solicitud de Cesantías Aprobada por Administración - Pendiente de RRHH',
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

// Función para notificar a administradores (jefes de área de ADMINISTRACIÓN)
async function notificarAAdministradores(solicitud, tipo) {
  try {
    console.log('🔍 DEBUG: Iniciando notificarAAdministradores para cesantías...');
    console.log('🔍 DEBUG: Tipo de notificación:', tipo);
    console.log('🔍 DEBUG: Solicitud ID:', solicitud?.id);
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    const db = require('../../config/database');
    
    // Primero, verificar qué departamentos existen
    const Departamento = require('../../models/EstructuraEmpresa/Departamento');
    const departamentos = await Departamento.findAll({
      attributes: ['id', 'nombre']
    });
    console.log('🔍 DEBUG: Departamentos disponibles en la base de datos:');
    departamentos.forEach(dept => {
      console.log(`   - ID: ${dept.id}, Nombre: "${dept.nombre}"`);
    });
    
    // Buscar jefes de área del departamento ADMINISTRACIÓN (con variaciones de nombre)
    console.log('🔍 DEBUG: Buscando jefes de área del departamento ADMINISTRACIÓN...');
    let jefesAdministracion = await Usuario.findAll({
      include: [
        {
          model: Rol,
          as: 'roles',
          where: { nombre: 'JEFE AREA' }
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'email'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  where: { 
                    [db.Sequelize.Op.or]: [
                      { nombre: 'ADMINISTRACIÓN' },
                      { nombre: 'ADMINISTRACION' },
                      { nombre: 'ADMINISTRACION' },
                      { nombre: 'ADMIN' }
                    ]
                  },
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    // Si no se encontraron jefes por nombre, intentar por ID del departamento
    if (jefesAdministracion.length === 0) {
      console.log('🔍 DEBUG: No se encontraron jefes por nombre, intentando por ID del departamento...');
      
      // Buscar el departamento de administración por ID (asumiendo que es el ID 4 según el código)
      const departamentoAdmin = await Departamento.findOne({
        where: { 
          [db.Sequelize.Op.or]: [
            { id: 4 }, // ID común para ADMINISTRACIÓN
            { nombre: { [db.Sequelize.Op.like]: '%ADMIN%' } }
          ]
        }
      });
      
      if (departamentoAdmin) {
        console.log(`🔍 DEBUG: Departamento de administración encontrado: ID ${departamentoAdmin.id}, Nombre: "${departamentoAdmin.nombre}"`);
        
        jefesAdministracion = await Usuario.findAll({
          include: [
            {
              model: Rol,
              as: 'roles',
              where: { nombre: 'JEFE AREA' }
            },
            {
              model: Empleado,
              as: 'empleado',
              attributes: ['id', 'nombres', 'email'],
              include: [
                {
                  model: Area,
                  as: 'areas',
                  attributes: ['id', 'nombre'],
                  include: [
                    {
                      model: Departamento,
                      as: 'departamento',
                      where: { id: departamentoAdmin.id },
                      attributes: ['id', 'nombre']
                    }
                  ]
                }
              ]
            }
          ]
        });
        
        console.log(`🔍 DEBUG: Jefes encontrados por ID del departamento: ${jefesAdministracion.length}`);
      }
    }
    
    console.log('🔍 DEBUG: Jefes de administración encontrados:', jefesAdministracion.length);
    jefesAdministracion.forEach((jefe, index) => {
      console.log(`   ${index + 1}. Jefe: ${jefe.empleado?.nombres} (${jefe.empleado?.email})`);
      console.log(`      Áreas: ${jefe.empleado?.areas?.map(a => `${a.nombre} (${a.departamento?.nombre})`).join(', ')}`);
    });
    
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    console.log('🔍 DEBUG: Empleado solicitante:', empleado?.nombres);
    
    for (const jefe of jefesAdministracion) {
      if (jefe.empleado?.email) {
        try {
          const { getCesantiasNotificarAdministracionTemplate } = require('../../utils/emailTemplates');
          const emailHTML = getCesantiasNotificarAdministracionTemplate(empleado, solicitud);
          await sendMail(
            jefe.empleado.email,
            '🆕 Nueva Solicitud de Cesantías Pendiente de Aprobación - Administración',
            emailHTML
          );
          console.log('✅ Correo de notificación enviado al jefe de administración:', jefe.empleado.email);
        } catch (mailError) {
          console.error('❌ Error al enviar correo al jefe de administración:', mailError);
        }
      }
    }
    
    // Si no hay jefes de administración, notificar a usuarios con rol ADMINISTRADOR como fallback
    if (jefesAdministracion.length === 0) {
      console.log('⚠️  No se encontraron jefes de área de ADMINISTRACIÓN, notificando a administradores generales');
      const administradores = await Usuario.findAll({
        include: [
          {
            model: Rol,
            as: 'roles',
            where: { nombre: 'ADMINISTRADOR' }
          },
          {
            model: Empleado,
            as: 'empleado',
            attributes: ['id', 'nombres', 'email']
          }
        ]
      });
      
      console.log('🔍 DEBUG: Administradores encontrados:', administradores.length);
      administradores.forEach((admin, index) => {
        console.log(`   ${index + 1}. Admin: ${admin.empleado?.nombres} (${admin.empleado?.email})`);
      });
      
      for (const admin of administradores) {
        if (admin.empleado?.email) {
          try {
            const { getCesantiasNotificarAdministracionTemplate } = require('../../utils/emailTemplates');
            const emailHTML = getCesantiasNotificarAdministracionTemplate(empleado, solicitud);
            await sendMail(
              admin.empleado.email,
              '🆕 Nueva Solicitud de Cesantías Pendiente de Aprobación - Administración',
              emailHTML
            );
            console.log('✅ Correo de notificación enviado al administrador:', admin.empleado.email);
          } catch (mailError) {
            console.error('❌ Error al enviar correo al administrador:', mailError);
          }
        }
      }
    }
    
    // Resumen final de notificaciones enviadas
    const totalNotificaciones = jefesAdministracion.length + (jefesAdministracion.length === 0 ? administradores.length : 0);
    console.log(`🎯 RESUMEN: Se enviaron ${totalNotificaciones} notificaciones a jefes de administración/administradores`);
    
  } catch (error) {
    console.error('Error al notificar administradores:', error);
  }
} 

// Función para notificar a RRHH (jefes de área de RRHH)
async function notificarARRHH(solicitud, tipo) {
  try {
    console.log('🔍 DEBUG: Iniciando notificarARRHH para cesantías...');
    console.log('🔍 DEBUG: Tipo de notificación:', tipo);
    console.log('🔍 DEBUG: Solicitud ID:', solicitud?.id);
    
    const Usuario = require('../../models/Usuario');
    const Rol = require('../../models/Rol');
    
    // Buscar jefes de área del departamento RECURSOS HUMANOS
    const jefesRRHH = await Usuario.findAll({
      include: [
        {
          model: Rol,
          as: 'roles',
          where: { nombre: 'JEFE AREA' }
        },
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['id', 'nombres', 'email'],
          include: [
            {
              model: Area,
              as: 'areas',
              attributes: ['id', 'nombre'],
              include: [
                {
                  model: Departamento,
                  as: 'departamento',
                  where: { nombre: 'RECURSOS HUMANOS' },
                  attributes: ['id', 'nombre']
                }
              ]
            }
          ]
        }
      ]
    });
    
    console.log('🔍 DEBUG: Jefes de RRHH encontrados:', jefesRRHH.length);
    jefesRRHH.forEach((jefe, index) => {
      console.log(`   ${index + 1}. Jefe: ${jefe.empleado?.nombres} (${jefe.empleado?.email})`);
      console.log(`      Áreas: ${jefe.empleado?.areas?.map(a => `${a.nombre} (${a.departamento?.nombre})`).join(', ')}`);
    });
    
    const empleado = await Empleado.findByPk(solicitud.empleado_id);
    console.log('🔍 DEBUG: Empleado solicitante:', empleado?.nombres);
    
    for (const jefe of jefesRRHH) {
      if (jefe.empleado?.email) {
        try {
          const { getCesantiasNotificarRRHHTemplate } = require('../../utils/emailTemplates');
          const emailHTML = getCesantiasNotificarRRHHTemplate(empleado, solicitud);
          await sendMail(
            jefe.empleado.email,
            '🆕 Solicitud de Cesantías Aprobada por Administración - Pendiente de RRHH',
            emailHTML
          );
          console.log('✅ Correo de notificación enviado al jefe de RRHH:', jefe.empleado.email);
        } catch (mailError) {
          console.error('❌ Error al enviar correo al jefe de RRHH:', mailError);
        }
      }
    }
    
    // Si no hay jefes de RRHH, notificar a usuarios con rol RRHH como fallback
    if (jefesRRHH.length === 0) {
      console.log('⚠️  No se encontraron jefes de área de RRHH, notificando a personal de RRHH general');
      const rrhh = await Usuario.findAll({
        include: [
          {
            model: Rol,
            as: 'roles',
            where: { nombre: 'RRHH' }
          },
          {
            model: Empleado,
            as: 'empleado',
            attributes: ['id', 'nombres', 'email']
          }
        ]
      });
      
      console.log('🔍 DEBUG: Personal de RRHH encontrado:', rrhh.length);
      rrhh.forEach((usuario, index) => {
        console.log(`   ${index + 1}. RRHH: ${usuario.empleado?.nombres} (${usuario.empleado?.email})`);
      });
      
      for (const usuario of rrhh) {
        if (usuario.empleado?.email) {
          try {
            const { getCesantiasNotificarRRHHTemplate } = require('../../utils/emailTemplates');
            const emailHTML = getCesantiasNotificarRRHHTemplate(empleado, solicitud);
            await sendMail(
              usuario.empleado.email,
              '🆕 Solicitud de Cesantías Aprobada por Administración - Pendiente de RRHH',
              emailHTML
            );
            console.log('✅ Correo de notificación enviado a RRHH:', usuario.empleado.email);
          } catch (mailError) {
            console.error('❌ Error al enviar correo a RRHH:', mailError);
          }
        }
      }
    }
    
    // Resumen final de notificaciones enviadas
    const totalNotificaciones = jefesRRHH.length + (jefesRRHH.length === 0 ? rrhh.length : 0);
    console.log(`🎯 RESUMEN: Se enviaron ${totalNotificaciones} notificaciones a jefes de RRHH/personal de RRHH`);
    
  } catch (error) {
    console.error('Error al notificar RRHH:', error);
  }
} 