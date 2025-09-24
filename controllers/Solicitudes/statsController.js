const { Op } = require('sequelize');
const Solicitud = require('../../models/Solicitudes/Solicitud');
const Empleado = require('../../models/Empleado');
const TipoSolicitud = require('../../models/Solicitudes/TipoSolicitud');
const EmpleadoArea = require('../../models/EstructuraEmpresa/EmpleadosAreas');
const Area = require('../../models/EstructuraEmpresa/Area');

// Función auxiliar para obtener estadísticas de permisos
const obtenerStatsPermisos = async (solicitudes) => {
    const totalPermisos = solicitudes.length;
    const permisosPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const permisosAprobados = solicitudes.filter(s => s.estado === 'aprobado').length;
    const permisosRechazados = solicitudes.filter(s => s.estado === 'rechazado').length;
    const permisosVistoBueno = solicitudes.filter(s => s.estado === 'visto_bueno').length;

    // Permisos de este mes
    const fechaActual = new Date();
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const permisosEsteMes = solicitudes.filter(s => {
        const fechaSolicitud = new Date(s.fecha_creacion);
        return fechaSolicitud >= primerDiaMes;
    }).length;

    // Permisos por tipo
    const permisosPorTipo = {};
    solicitudes.forEach(s => {
        const tipo = s.tipo_solicitud?.nombre || 'Sin tipo';
        if (!permisosPorTipo[tipo]) {
            permisosPorTipo[tipo] = 0;
        }
        permisosPorTipo[tipo]++;
    });

    const permisosPorTipoArray = Object.entries(permisosPorTipo).map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        porcentaje: totalPermisos > 0 ? Math.round((cantidad / totalPermisos) * 100) : 0
    }));

    // Permisos por empleado
    const permisosPorEmpleado = {};
    solicitudes.forEach(s => {
        const empleado = s.empleado?.nombres || 'Sin nombre';
        if (!permisosPorEmpleado[empleado]) {
            permisosPorEmpleado[empleado] = {
                empleado,
                totalPermisos: 0,
                aprobados: 0,
                pendientes: 0,
                rechazados: 0
            };
        }
        permisosPorEmpleado[empleado].totalPermisos++;
        if (s.estado === 'aprobado') permisosPorEmpleado[empleado].aprobados++;
        if (s.estado === 'pendiente') permisosPorEmpleado[empleado].pendientes++;
        if (s.estado === 'rechazado') permisosPorEmpleado[empleado].rechazados++;
    });

    const permisosPorEmpleadoArray = Object.values(permisosPorEmpleado);

    // Permisos por mes (últimos 6 meses del calendario actual)
    const permisosUltimosMeses = [];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Calcular los últimos 6 meses del calendario actual
    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        const año = fecha.getFullYear();
        const mes = fecha.getMonth();
        const nombreMes = meses[mes];
        
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0, 23, 59, 59);
        
        const cantidad = solicitudes.filter(s => {
            const fechaSolicitud = new Date(s.fecha_creacion);
            return fechaSolicitud >= primerDia && fechaSolicitud <= ultimoDia;
        }).length;

        permisosUltimosMeses.push({ 
            mes: `${nombreMes} ${año}`, 
            cantidad 
        });
    }

    return {
        totalPermisos,
        permisosPendientes,
        permisosAprobados,
        permisosRechazados,
        permisosVistoBueno,
        permisosEsteMes,
        permisosPorTipo: permisosPorTipoArray,
        permisosPorEmpleado: permisosPorEmpleadoArray,
        permisosUltimosMeses
    };
};

// Obtener estadísticas generales de permisos
const obtenerStatsGenerales = async (req, res) => {
    try {
        const solicitudes = await Solicitud.findAll({
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        const stats = await obtenerStatsPermisos(solicitudes);
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas generales:', error);
        res.status(500).json({
            message: 'Error al obtener estadísticas de permisos',
            error: error.message
        });
    }
};

// Obtener estadísticas de permisos por empleado
const obtenerStatsPorEmpleado = async (req, res) => {
    try {
        const { empleado_id } = req.params;
        
        const solicitudes = await Solicitud.findAll({
            where: { empleado_id },
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        const stats = await obtenerStatsPermisos(solicitudes);
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas por empleado:', error);
        res.status(500).json({
            message: 'Error al obtener estadísticas de permisos del empleado',
            error: error.message
        });
    }
};

// Obtener estadísticas de permisos por jefe
const obtenerStatsPorJefe = async (req, res) => {
    try {
        const { jefe_id } = req.params;
        
        // Obtener empleados que reportan al jefe
        const empleadoAreas = await EmpleadoArea.findAll({
            include: [{
                model: Area,
                as: 'area',
                where: { jefe_id },
                attributes: ['id']
            }]
        });

        const empleadoIds = empleadoAreas.map(ea => ea.empleado_id);
        
        if (empleadoIds.length === 0) {
            return res.json({
                totalPermisos: 0,
                permisosPendientes: 0,
                permisosAprobados: 0,
                permisosRechazados: 0,
                permisosVistoBueno: 0,
                permisosEsteMes: 0,
                permisosPorTipo: [],
                permisosPorEmpleado: [],
                permisosUltimosMeses: []
            });
        }

        const solicitudes = await Solicitud.findAll({
            where: { 
                empleado_id: { [Op.in]: empleadoIds }
            },
            include: [
                {
                    model: Empleado,
                    as: 'empleado',
                    attributes: ['nombres']
                },
                {
                    model: TipoSolicitud,
                    as: 'tipo_solicitud',
                    attributes: ['nombre']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        const stats = await obtenerStatsPermisos(solicitudes);
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas por jefe:', error);
        res.status(500).json({
            message: 'Error al obtener estadísticas de permisos del jefe',
            error: error.message
        });
    }
};

module.exports = {
    obtenerStatsGenerales,
    obtenerStatsPorEmpleado,
    obtenerStatsPorJefe
}; 