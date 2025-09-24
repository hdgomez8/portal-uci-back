const { Empleado } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Obtener estadísticas generales del dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Contar total de empleados
    const totalEmpleados = await Empleado.count();
    
    // Contar empleados activos (sin fecha de salida o fecha de salida futura)
    const empleadosActivos = await Empleado.count({
      where: {
        [Op.or]: [
          { fecha_salida: null },
          { fecha_salida: { [Op.gt]: new Date() } }
        ]
      }
    });

    // Contar empleados inactivos (con fecha de salida pasada)
    const empleadosInactivos = await Empleado.count({
      where: {
        fecha_salida: { [Op.lt]: new Date() }
      }
    });

    // Contar empleados nuevos (ingresados en los últimos 30 días)
    const empleadosNuevos = await Empleado.count({
      where: {
        fecha_ingreso: {
          [Op.gte]: moment().subtract(30, 'days').toDate()
        }
      }
    });

    // Contar empleados que salieron en los últimos 30 días
    const empleadosSalida = await Empleado.count({
      where: {
        fecha_salida: {
          [Op.gte]: moment().subtract(30, 'days').toDate(),
          [Op.lte]: new Date()
        }
      }
    });

    // Para solicitudes de vacaciones y contratos por vencer, 
    // por ahora retornamos valores estimados basados en el total de empleados
    const solicitudesVacaciones = Math.floor(empleadosActivos * 0.1); // 10% del total activos
    const solicitudesPendientes = Math.floor(solicitudesVacaciones * 0.3); // 30% de las solicitudes
    const contratosPorVencer = Math.floor(empleadosActivos * 0.05); // 5% del total activos

    const stats = {
      totalEmpleados,
      empleadosActivos,
      empleadosInactivos,
      solicitudesVacaciones,
      solicitudesPendientes,
      contratosPorVencer,
      nuevosEmpleados: empleadosNuevos,
      empleadosSalida
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener empleados recientes
const getRecentEmployees = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const empleados = await Empleado.findAll({
      attributes: ['id', 'nombres', 'oficio', 'fecha_ingreso', 'estado_trabajador'],
      order: [['fecha_ingreso', 'DESC']],
      limit: parseInt(limit),
      where: {
        [Op.or]: [
          { fecha_salida: null },
          { fecha_salida: { [Op.gt]: new Date() } }
        ]
      }
    });

    res.json(empleados);
  } catch (error) {
    console.error('Error obteniendo empleados recientes:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener solicitudes de vacaciones (simulado por ahora)
const getVacationRequests = async (req, res) => {
  try {
    // Por ahora retornamos datos simulados
    // En el futuro esto se conectará con la tabla de solicitudes
    const solicitudes = [
      {
        id: 1,
        empleado: 'Juan Pérez',
        fecha_inicio: '2024-03-15',
        dias: 10,
        estado: 'Pendiente'
      },
      {
        id: 2,
        empleado: 'Laura Torres',
        fecha_inicio: '2024-04-01',
        dias: 5,
        estado: 'Aprobado'
      },
      {
        id: 3,
        empleado: 'Miguel Sánchez',
        fecha_inicio: '2024-04-10',
        dias: 7,
        estado: 'Pendiente'
      }
    ];

    res.json(solicitudes);
  } catch (error) {
    console.error('Error obteniendo solicitudes de vacaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener contratos por vencer
const getContractEndings = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Buscar empleados con contratos que vencen en los próximos 30 días
    const contratosPorVencer = await Empleado.findAll({
      attributes: ['id', 'nombres', 'oficio', 'fecha_salida', 'tipo_contrato'],
      where: {
        fecha_salida: {
          [Op.between]: [new Date(), moment().add(30, 'days').toDate()]
        }
      },
      order: [['fecha_salida', 'ASC']],
      limit: parseInt(limit)
    });

    res.json(contratosPorVencer);
  } catch (error) {
    console.error('Error obteniendo contratos por vencer:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener datos de rotación para gráficos
const getRotationData = async (req, res) => {
  try {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const datosRotacion = {
      labels: meses,
      datasets: [
        {
          label: 'Nuevas Contrataciones',
          data: [],
          backgroundColor: '#00F5FF',
        },
        {
          label: 'Bajas',
          data: [],
          backgroundColor: '#FF00F5',
        },
      ],
    };

    // Calcular datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fechaInicio = moment().subtract(i, 'months').startOf('month');
      const fechaFin = moment().subtract(i, 'months').endOf('month');

      // Contar nuevas contrataciones en el mes
      const nuevasContrataciones = await Empleado.count({
        where: {
          fecha_ingreso: {
            [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
          }
        }
      });

      // Contar bajas en el mes
      const bajas = await Empleado.count({
        where: {
          fecha_salida: {
            [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
          }
        }
      });

      datosRotacion.datasets[0].data.push(nuevasContrataciones);
      datosRotacion.datasets[1].data.push(bajas);
    }

    res.json(datosRotacion);
  } catch (error) {
    console.error('Error obteniendo datos de rotación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentEmployees,
  getVacationRequests,
  getContractEndings,
  getRotationData
}; 