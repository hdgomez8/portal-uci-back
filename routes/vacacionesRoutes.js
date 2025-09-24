const express = require('express');
const router = express.Router();
const VacacionesController = require('../controllers/Solicitudes/VacacionesController');
const VacacionesStatsController = require('../controllers/Solicitudes/VacacionesStatsController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas principales
router.post('/', verificarToken, VacacionesController.crearVacaciones);
router.get('/', verificarToken, VacacionesController.listarVacaciones);
router.get('/empleado/:empleado_id', verificarToken, VacacionesController.listarVacacionesEmpleado);
router.get('/jefe', verificarToken, VacacionesController.listarVacacionesPorJefe);
router.get('/estado/:estado', verificarToken, VacacionesController.listarVacacionesPorEstado);
router.get('/:id', verificarToken, VacacionesController.obtenerVacaciones);
router.put('/:id', verificarToken, VacacionesController.actualizarVacaciones);
router.delete('/:id', verificarToken, VacacionesController.eliminarVacaciones);

// Rutas de acciones específicas
router.put('/:id/aprobar', verificarToken, VacacionesController.aprobarVacaciones);
router.put('/:id/rechazar', verificarToken, VacacionesController.rechazarVacaciones);

// Rutas para sistema de visto bueno
router.get('/pendientes-visto-bueno', verificarToken, VacacionesController.listarPendientesVistoBueno);
router.put('/:id/aprobar-visto-bueno', verificarToken, VacacionesController.aprobarVistoBueno);
router.put('/:id/rechazar-visto-bueno', verificarToken, VacacionesController.rechazarVistoBueno);

// Rutas para el flujo de aprobación por niveles
router.put('/:id/aprobar-por-jefe', verificarToken, VacacionesController.aprobarPorJefe);
router.put('/:id/rechazar-por-jefe', verificarToken, VacacionesController.rechazarPorJefe);
router.put('/:id/aprobar-por-administracion', verificarToken, VacacionesController.aprobarPorAdministracion);
router.put('/:id/rechazar-por-administracion', verificarToken, VacacionesController.rechazarPorAdministracion);
router.put('/:id/aprobar-por-rrhh', verificarToken, VacacionesController.aprobarPorRRHH);
router.put('/:id/rechazar-por-rrhh', verificarToken, VacacionesController.rechazarPorRRHH);

// Rutas de estadísticas
router.get('/stats/empleado/:empleadoId', verificarToken, VacacionesStatsController.getStatsByEmployee);
router.get('/stats/jefe/:jefeId', verificarToken, VacacionesStatsController.getStatsByJefe);
router.get('/stats/general', verificarToken, VacacionesStatsController.getStatsGeneral);

// Ruta para descargar archivo PDF
router.get('/:id/descargar-pdf', verificarToken, VacacionesController.descargarPDF);

module.exports = router; 