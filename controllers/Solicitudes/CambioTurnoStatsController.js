const models = require('../../models');
const CambioTurno = models.CambioTurno;
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
    console.log('Modelo CambioTurno:', CambioTurno);
    console.log('Modelo Empleado:', Empleado);

    // Verificar si los modelos están disponibles
    if (!CambioTurno) {
      return res.status(500).json({ error: 'Modelo CambioTurno no encontrado' });
    }

    if (!Empleado) {
      return res.status(500).json({ error: 'Modelo Empleado no encontrado' });
    }

    // Obtener estadísticas básicas
    const totalCambiosTurno = await CambioTurno.count({
      where: { empleado_id: empleadoIdNum, deleted_at: null }
    });

    const cambiosPendientes = await CambioTurno.count({
      where: { empleado_id: empleadoIdNum, estado: 'Pendiente', deleted_at: null }
    });

    const cambiosAprobados = await CambioTurno.count({
      where: { empleado_id: empleadoIdNum, estado: 'Aprobado', deleted_at: null }
    });

    const cambiosRechazados = await CambioTurno.count({
      where: { empleado_id: empleadoIdNum, estado: 'Rechazado', deleted_at: null }
    });

    const cambiosEnRevision = await CambioTurno.count({
      where: { empleado_id: empleadoIdNum, estado: 'En Revisión', deleted_at: null }
    });

    const cambiosPorVistoBueno = await CambioTurno.count({
      where: { 
        empleado_id: empleadoIdNum, 
        visto_bueno_reemplazo: 'Pendiente', 
        deleted_at: null 
      }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const cambiosEsteMes = await CambioTurno.count({
      where: {
        empleado_id: empleadoIdNum,
        fecha_creacion: { [db.Sequelize.Op.gte]: inicioMes },
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
      
      const cantidad = await CambioTurno.count({
        where: {
          empleado_id: empleadoIdNum,
          fecha_creacion: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    // Estadísticas por turno
    const cambiosPorTurno = await CambioTurno.findAll({
      where: { empleado_id: empleadoIdNum, deleted_at: null },
      attributes: [
        'horario_cambiar',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad']
      ],
      group: ['horario_cambiar'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
    });

    res.json({
      totalCambiosTurno,
      cambiosPendientes,
      cambiosAprobados,
      cambiosRechazados,
      cambiosEnRevision,
      cambiosEsteMes,
      cambiosPorVistoBueno,
      cambiosPorEmpleado: [],
      cambiosUltimosMeses: meses,
      cambiosPorTurno: cambiosPorTurno.map(item => ({
        turno: item.horario_cambiar,
        cantidad: parseInt(item.dataValues.cantidad)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cambio de turno del empleado:', error);
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
        totalCambiosTurno: 0,
        cambiosPendientes: 0,
        cambiosAprobados: 0,
        cambiosRechazados: 0,
        cambiosEnRevision: 0,
        cambiosEsteMes: 0,
        cambiosPorVistoBueno: 0,
        cambiosPorEmpleado: [],
        cambiosUltimosMeses: [],
        cambiosPorTurno: []
      });
    }

    // Estadísticas básicas
    const totalCambiosTurno = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      }
    });

    const cambiosPendientes = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'Pendiente',
        deleted_at: null 
      }
    });

    const cambiosAprobados = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'Aprobado',
        deleted_at: null 
      }
    });

    const cambiosRechazados = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'Rechazado',
        deleted_at: null 
      }
    });

    const cambiosEnRevision = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        estado: 'En Revisión',
        deleted_at: null 
      }
    });

    const cambiosPorVistoBueno = await CambioTurno.count({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        visto_bueno_reemplazo: 'Pendiente',
        deleted_at: null 
      }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const cambiosEsteMes = await CambioTurno.count({
      where: {
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        fecha_creacion: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Obtener todas las solicitudes para procesar estadísticas por empleado
    const solicitudes = await CambioTurno.findAll({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      },
      include: [{ model: Empleado, as: 'empleado', attributes: ['nombres'] }]
    });

    // Cambios por empleado
    const cambiosPorEmpleado = {};
    solicitudes.forEach(s => {
      const empleado = s.empleado?.nombres || 'Sin nombre';
      if (!cambiosPorEmpleado[empleado]) {
        cambiosPorEmpleado[empleado] = {
          empleado,
          totalCambios: 0,
          aprobados: 0,
          pendientes: 0,
          rechazados: 0
        };
      }
      cambiosPorEmpleado[empleado].totalCambios++;
      if (s.estado === 'Aprobado') cambiosPorEmpleado[empleado].aprobados++;
      if (s.estado === 'Pendiente') cambiosPorEmpleado[empleado].pendientes++;
      if (s.estado === 'Rechazado') cambiosPorEmpleado[empleado].rechazados++;
    });

    const cambiosPorEmpleadoArray = Object.values(cambiosPorEmpleado);

    // Estadísticas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const cantidad = await CambioTurno.count({
        where: {
          empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
          fecha_creacion: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    // Estadísticas por turno
    const cambiosPorTurno = await CambioTurno.findAll({
      where: { 
        empleado_id: { [db.Sequelize.Op.in]: empleadosIds },
        deleted_at: null 
      },
      attributes: [
        'horario_cambiar',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad']
      ],
      group: ['horario_cambiar'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
    });

    res.json({
      totalCambiosTurno,
      cambiosPendientes,
      cambiosAprobados,
      cambiosRechazados,
      cambiosEnRevision,
      cambiosEsteMes,
      cambiosPorVistoBueno,
      cambiosPorEmpleado: cambiosPorEmpleadoArray,
      cambiosUltimosMeses: meses,
      cambiosPorTurno: cambiosPorTurno.map(item => ({
        turno: item.horario_cambiar,
        cantidad: parseInt(item.dataValues.cantidad)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de cambio de turno del jefe:', error);
    res.status(500).json({ error: error.message });
  }
};

// Estadísticas generales
exports.getStatsGeneral = async (req, res) => {
  try {
    // Estadísticas básicas
    const totalCambiosTurno = await CambioTurno.count({
      where: { deleted_at: null }
    });

    const cambiosPendientes = await CambioTurno.count({
      where: { estado: 'Pendiente', deleted_at: null }
    });

    const cambiosAprobados = await CambioTurno.count({
      where: { estado: 'Aprobado', deleted_at: null }
    });

    const cambiosRechazados = await CambioTurno.count({
      where: { estado: 'Rechazado', deleted_at: null }
    });

    const cambiosEnRevision = await CambioTurno.count({
      where: { estado: 'En Revisión', deleted_at: null }
    });

    const cambiosPorVistoBueno = await CambioTurno.count({
      where: { visto_bueno_reemplazo: 'Pendiente', deleted_at: null }
    });

    // Estadísticas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const cambiosEsteMes = await CambioTurno.count({
      where: {
        fecha_creacion: { [db.Sequelize.Op.gte]: inicioMes },
        deleted_at: null
      }
    });

    // Estadísticas por empleado
    const cambiosPorEmpleado = await CambioTurno.findAll({
      where: { deleted_at: null },
      attributes: [
        'empleado_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalCambios'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'Aprobado' THEN 1 ELSE 0 END")), 'aprobados'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END")), 'pendientes'],
        [db.Sequelize.fn('SUM', db.Sequelize.literal("CASE WHEN estado = 'Rechazado' THEN 1 ELSE 0 END")), 'rechazados']
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
      
      const cantidad = await CambioTurno.count({
        where: {
          fecha_creacion: { [db.Sequelize.Op.between]: [inicioMes, finMes] },
          deleted_at: null
        }
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cantidad
      });
    }

    // Estadísticas por turno
    const cambiosPorTurno = await CambioTurno.findAll({
      where: { deleted_at: null },
      attributes: [
        'horario_cambiar',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad']
      ],
      group: ['horario_cambiar'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']]
    });

    res.json({
      totalCambiosTurno,
      cambiosPendientes,
      cambiosAprobados,
      cambiosRechazados,
      cambiosEnRevision,
      cambiosEsteMes,
      cambiosPorVistoBueno,
      cambiosPorEmpleado: cambiosPorEmpleado.map(item => ({
        empleado: item.empleado.nombres,
        totalCambios: parseInt(item.dataValues.totalCambios),
        aprobados: parseInt(item.dataValues.aprobados) || 0,
        pendientes: parseInt(item.dataValues.pendientes) || 0,
        rechazados: parseInt(item.dataValues.rechazados) || 0
      })),
      cambiosUltimosMeses: meses,
      cambiosPorTurno: cambiosPorTurno.map(item => ({
        turno: item.horario_cambiar,
        cantidad: parseInt(item.dataValues.cantidad)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales de cambio de turno:', error);
    res.status(500).json({ error: error.message });
  }
}; 