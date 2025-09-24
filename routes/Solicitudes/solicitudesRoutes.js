const express = require('express');
const {obtenerSolicitudes, crearSolicitud, obtenerSolicitudesPorEmpleado, obtenerSolicitudesPorJefe, actualizarEstadoSolicitud, descargarPDF} = require('../../controllers/Solicitudes/solicitudController');
const {obtenerStatsGenerales, obtenerStatsPorEmpleado, obtenerStatsPorJefe} = require('../../controllers/Solicitudes/statsController');
const uploadSoportesSolicitud = require('../../middlewares/uploadSoportesSolicitud');

const router = express.Router();

router.get('/', obtenerSolicitudes);  // Obtener todos los roles
router.post('/', uploadSoportesSolicitud.array('adjuntos', 5), crearSolicitud);
router.get('/empleado/:empleado_id', obtenerSolicitudesPorEmpleado);
router.get('/jefe/:jefe_id', obtenerSolicitudesPorJefe);  // Obtener solicitudes de empleados del jefe
router.put('/:id/estado', actualizarEstadoSolicitud);  // Actualizar estado de solicitud
router.get('/:id/pdf', descargarPDF);  // Descargar PDF de solicitud aprobada

// Rutas para estadísticas
router.get('/stats', obtenerStatsGenerales);
router.get('/stats/empleado/:empleado_id', obtenerStatsPorEmpleado);
router.get('/stats/jefe/:jefe_id', obtenerStatsPorJefe);

module.exports = router;

