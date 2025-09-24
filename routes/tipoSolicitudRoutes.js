const express = require('express');
const router = express.Router();
const { 
    obtenerTiposSolicitud, 
    crearTipoSolicitud, 
    actualizarTipoSolicitud, 
    eliminarTipoSolicitud 
} = require('../controllers/Solicitudes/tipoSolicitudController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas para tipos de solicitud
router.get('/', verificarToken, obtenerTiposSolicitud);
router.post('/', verificarToken, crearTipoSolicitud);
router.put('/:id', verificarToken, actualizarTipoSolicitud);
router.delete('/:id', verificarToken, eliminarTipoSolicitud);

module.exports = router; 