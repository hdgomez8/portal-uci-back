const express = require('express');
const router = express.Router();
const CesantiasController = require('../controllers/Solicitudes/CesantiasController');
const CesantiasStatsController = require('../controllers/Solicitudes/CesantiasStatsController');

// Rutas principales
router.post('/', CesantiasController.crearCesantias);
router.get('/', CesantiasController.listarCesantias);
router.get('/empleado/:empleado_id', CesantiasController.listarCesantiasEmpleado);
router.get('/estado/:estado', CesantiasController.listarCesantiasPorEstado);
router.get('/:id', CesantiasController.obtenerCesantias);
router.put('/:id', CesantiasController.actualizarCesantias);
router.delete('/:id', CesantiasController.eliminarCesantias);

// Rutas de acciones específicas
router.put('/:id/aprobar', CesantiasController.aprobarCesantias);
router.put('/:id/rechazar', CesantiasController.rechazarCesantias);

// Rutas de estadísticas
router.get('/stats/empleado/:empleadoId', CesantiasStatsController.getStatsByEmployee);
router.get('/stats/jefe/:jefeId', CesantiasStatsController.getStatsByJefe);
router.get('/stats/general', CesantiasStatsController.getStatsGeneral);

module.exports = router; 