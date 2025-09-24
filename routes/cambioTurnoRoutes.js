const express = require('express');
const router = express.Router();
const CambioTurnoController = require('../controllers/Solicitudes/CambioTurnoController');
const CambioTurnoStatsController = require('../controllers/Solicitudes/CambioTurnoStatsController');

router.post('/', CambioTurnoController.crearCambioTurno);
router.get('/', CambioTurnoController.listarCambiosTurno);
router.get('/pendientes-visto-bueno', CambioTurnoController.listarPendientesVistoBueno);

// Rutas para jefes de área (DEBE IR ANTES DE /:id)
router.get('/en-revision', CambioTurnoController.listarEnRevision);

// Rutas específicas (DEBEN IR ANTES DE /:id)
router.get('/empleado/:empleadoId', CambioTurnoController.listarCambiosTurnoPorEmpleado);

router.get('/:id', CambioTurnoController.obtenerCambioTurno);
router.put('/:id', CambioTurnoController.actualizarCambioTurno);
router.delete('/:id', CambioTurnoController.eliminarCambioTurno);

// Rutas para visto bueno
router.post('/:id/aprobar-visto-bueno', CambioTurnoController.aprobarVistoBueno);
router.post('/:id/rechazar-visto-bueno', CambioTurnoController.rechazarVistoBueno);

// Rutas para jefes de área
router.post('/:id/aprobar-por-jefe', CambioTurnoController.aprobarPorJefe);
router.post('/:id/rechazar-por-jefe', CambioTurnoController.rechazarPorJefe);

// Rutas de estadísticas
router.get('/stats/empleado/:empleadoId', CambioTurnoStatsController.getStatsByEmployee);
router.get('/stats/jefe/:jefeId', CambioTurnoStatsController.getStatsByJefe);
router.get('/stats/general', CambioTurnoStatsController.getStatsGeneral);

module.exports = router; 