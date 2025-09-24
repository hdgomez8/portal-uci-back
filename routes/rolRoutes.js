const express = require('express');
const { obtenerRoles, obtenerRolPorId } = require('../controllers/rolController');

const router = express.Router();

// Ruta pública para obtener roles (no requiere autenticación)
router.get('/', obtenerRoles);
router.get('/:id', obtenerRolPorId);

module.exports = router; 