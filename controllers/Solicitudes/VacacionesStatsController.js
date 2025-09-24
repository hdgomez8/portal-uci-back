const models = require('../../models');
const Vacaciones = models.Vacaciones;
const Empleado = models.Empleado;
const db = require('../../config/database');
const EmpleadoArea = models.EmpleadoArea;
const Area = models.Area;

// Estadísticas por empleado
exports.getStatsByEmployee = async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const empleadoIdNum = parseInt(empleadoId);

    console.log('Empleado ID:', empleadoIdNum);
    console.log('Modelo Vacaciones:', Vacaciones);
    console.log('Modelo Empleado:', Empleado);

    // Verificar si los modelos están disponibles
    if (!Vacaciones) {
      return res.status(500).json({ error: 'Modelo Vacaciones no encontrado' });
    }

    if (!Empleado) {
      return res.status(500).json({ error: 'Modelo Empleado no encontrado' });
    }

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

    // Obtener empleados a cargo del jefe usando la misma lógica que permisos
    const empleadoAreas = await EmpleadoArea.findAll({
      include: [{
        model: Area,
        as: 'area',
        where: { jefe_id: jefeIdNum },
        attributes: ['id']
      }]
    });

    const empleadosIds = empleadoAreas.map(ea => ea.empleado_id);

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

    // Vacaciones por empleado
    const vacacionesPorEmpleado = {};
    solicitudes.forEach(s => {
      const empleado = s.empleado?.nombres || 'Sin nombre';
      if (!vacacionesPorEmpleado[empleado]) {
        vacacionesPorEmpleado[empleado] = {
          empleado,
          totalVacaciones: 0,
          diasSolicitados: 0
        };
      }
      vacacionesPorEmpleado[empleado].totalVacaciones++;
      vacacionesPorEmpleado[empleado].diasSolicitados += (parseInt(s.dias_disfrute) || 0);
    });

    const vacacionesPorEmpleadoArray = Object.values(vacacionesPorEmpleado);

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
      vacacionesPorEmpleado: vacacionesPorEmpleadoArray,
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