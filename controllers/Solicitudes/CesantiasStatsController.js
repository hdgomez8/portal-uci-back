const models = require('../../models');
const Cesantias = models.Cesantias;
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
    console.log('Modelo Cesantias:', Cesantias);
    console.log('Modelo Empleado:', Empleado);

    // Verificar si los modelos están disponibles
    if (!Cesantias) {
      return res.status(500).json({ error: 'Modelo Cesantias no encontrado' });
    }

    if (!Empleado) {
      return res.status(500).json({ error: 'Modelo Empleado no encontrado' });
    }

    // Obtener estadísticas básicas
    const totalCesantias = await Cesantias.count({
      where: { empleado_id: empleadoIdNum, deleted_at: null }
    });

    const cesantiasPendientes = await Cesantias.count({
      where: { empleado_id: empleadoIdNum, estado: 'pendiente', deleted_at: null }
    });

    const cesantiasAprobadas = await Cesantias.count({
      where: { empleado_id: empleadoIdNum, estado: 'aprobado', deleted_at: null }
    });

    const cesantiasRechazadas = await Cesantias.count({
      where: { empleado_id: empleadoIdNum, estado: 'rechazado', deleted_at: null }
    });

    const cesantiasEnRevision = await Cesantias.count({
      where: { empleado_id: empleadoIdNum, estado: 'en_revision', deleted_at: null }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const cesantiasEsteMes = await Cesantias.count({
      where: {
        empleado_id: empleadoIdNum,
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular montos totales solicitados
    const solicitudes = await Cesantias.findAll({
      where: { empleado_id: empleadoIdNum, deleted_at: null },
      attributes: ['monto_solicitado']
    });

    const montoTotalSolicitado = solicitudes.reduce((total, solicitud) => {
      return total + (parseFloat(solicitud.monto_solicitado) || 0);
    }, 0);

    const montoPromedioPorSolicitud = totalCesantias > 0 ? montoTotalSolicitado / totalCesantias : 0;

    // Estadísticas por tipo de solicitud
    const solicitudesCartaBanco = await Cesantias.count({
      where: { 
        empleado_id: empleadoIdNum, 
        tipo_retiro: 'carta_banco',
        deleted_at: null 
      }
    });

    const solicitudesConsignacion = await Cesantias.count({
      where: { 
        empleado_id: empleadoIdNum, 
        tipo_retiro: 'consignacion_cuenta',
        deleted_at: null 
      }
    });

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await Cesantias.count({
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
      totalCesantias,
      cesantiasPendientes,
      cesantiasAprobadas,
      cesantiasRechazadas,
      cesantiasEnRevision,
      cesantiasEsteMes,
      montoTotalSolicitado,
      montoPromedioPorSolicitud,
      solicitudesCartaBanco,
      solicitudesConsignacion,
      cesantiasPorEmpleado: [],
      cesantiasUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cesantías del empleado:', error);
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
        totalCesantias: 0,
        cesantiasPendientes: 0,
        cesantiasAprobadas: 0,
        cesantiasRechazadas: 0,
        cesantiasEnRevision: 0,
        cesantiasEsteMes: 0,
        montoTotalSolicitado: 0,
        montoPromedioPorSolicitud: 0,
        solicitudesCartaBanco: 0,
        solicitudesConsignacion: 0,
        cesantiasPorEmpleado: [],
        cesantiasUltimosMeses: []
      });
    }

    // Estadísticas básicas
    const totalCesantias = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      }
    });

    const cesantiasPendientes = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'pendiente',
        deleted_at: null 
      }
    });

    const cesantiasAprobadas = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'aprobado',
        deleted_at: null 
      }
    });

    const cesantiasRechazadas = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'rechazado',
        deleted_at: null 
      }
    });

    const cesantiasEnRevision = await Cesantias.count({
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
    
    const cesantiasEsteMes = await Cesantias.count({
      where: {
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular montos totales solicitados
    const solicitudes = await Cesantias.findAll({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      },
      attributes: ['monto_solicitado'],
      include: [{ model: Empleado, as: 'empleado', attributes: ['nombres'] }]
    });

    const montoTotalSolicitado = solicitudes.reduce((total, solicitud) => {
      return total + (parseFloat(solicitud.monto_solicitado) || 0);
    }, 0);

    const montoPromedioPorSolicitud = totalCesantias > 0 ? montoTotalSolicitado / totalCesantias : 0;

    // Estadísticas por tipo de solicitud
    const solicitudesCartaBanco = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        tipo_retiro: 'carta_banco',
        deleted_at: null 
      }
    });

    const solicitudesConsignacion = await Cesantias.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        tipo_retiro: 'consignacion_cuenta',
        deleted_at: null 
      }
    });

    // Cesantías por empleado
    const cesantiasPorEmpleado = {};
    solicitudes.forEach(s => {
      const empleado = s.empleado?.nombres || 'Sin nombre';
      if (!cesantiasPorEmpleado[empleado]) {
        cesantiasPorEmpleado[empleado] = {
          empleado,
          totalCesantias: 0,
          montoSolicitado: 0
        };
      }
      cesantiasPorEmpleado[empleado].totalCesantias++;
      cesantiasPorEmpleado[empleado].montoSolicitado += (parseFloat(s.monto_solicitado) || 0);
    });

    const cesantiasPorEmpleadoArray = Object.values(cesantiasPorEmpleado);

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await Cesantias.count({
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
      totalCesantias,
      cesantiasPendientes,
      cesantiasAprobadas,
      cesantiasRechazadas,
      cesantiasEnRevision,
      cesantiasEsteMes,
      montoTotalSolicitado,
      montoPromedioPorSolicitud,
      solicitudesCartaBanco,
      solicitudesConsignacion,
      cesantiasPorEmpleado: cesantiasPorEmpleadoArray,
      cesantiasUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cesantías del jefe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas generales
exports.getStatsGeneral = async (req, res) => {
  try {
    // Estadísticas básicas
    const totalCesantias = await Cesantias.count({
      where: { deleted_at: null }
    });

    const cesantiasPendientes = await Cesantias.count({
      where: { estado: 'pendiente', deleted_at: null }
    });

    const cesantiasAprobadas = await Cesantias.count({
      where: { estado: 'aprobado', deleted_at: null }
    });

    const cesantiasRechazadas = await Cesantias.count({
      where: { estado: 'rechazado', deleted_at: null }
    });

    const cesantiasEnRevision = await Cesantias.count({
      where: { estado: 'en_revision', deleted_at: null }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const cesantiasEsteMes = await Cesantias.count({
      where: {
        created_at: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Calcular montos totales solicitados
    const solicitudes = await Cesantias.findAll({
      where: { deleted_at: null },
      attributes: ['monto_solicitado']
    });

    const montoTotalSolicitado = solicitudes.reduce((total, solicitud) => {
      return total + (parseFloat(solicitud.monto_solicitado) || 0);
    }, 0);

    const montoPromedioPorSolicitud = totalCesantias > 0 ? montoTotalSolicitado / totalCesantias : 0;

    // Estadísticas por tipo de solicitud
    const solicitudesCartaBanco = await Cesantias.count({
      where: { tipo_retiro: 'carta_banco', deleted_at: null }
    });

    const solicitudesConsignacion = await Cesantias.count({
      where: { tipo_retiro: 'consignacion_cuenta', deleted_at: null }
    });

    // Estadísticas por empleado
    const cesantiasPorEmpleado = await Cesantias.findAll({
      where: { deleted_at: null },
      attributes: [
        'empleado_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCesantias'],
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
      
      const cantidad = await Cesantias.count({
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
      totalCesantias,
      cesantiasPendientes,
      cesantiasAprobadas,
      cesantiasRechazadas,
      cesantiasEnRevision,
      cesantiasEsteMes,
      montoTotalSolicitado,
      montoPromedioPorSolicitud,
      solicitudesCartaBanco,
      solicitudesConsignacion,
      cesantiasPorEmpleado: cesantiasPorEmpleado.map(item => ({
        empleado: item.empleado.nombres,
        totalCesantias: parseInt(item.dataValues.totalCesantias),
        aprobadas: parseInt(item.dataValues.aprobadas) || 0,
        pendientes: parseInt(item.dataValues.pendientes) || 0,
        rechazadas: parseInt(item.dataValues.rechazadas) || 0
      })),
      cesantiasUltimosMeses: meses
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales de cesantías:', error);
    res.status(500).json({ error: error.message });
  }
}; 