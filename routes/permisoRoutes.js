const express = require('express');
const { obtenerPermisos, crearPermiso, eliminarPermiso } = require('../controllers/permisoController');

const router = express.Router();

router.get('/', obtenerPermisos);  // Obtener todos los permisos
router.post('/', crearPermiso);  // Crear un nuevo permiso
router.delete('/:id', eliminarPermiso);  // Eliminar un permiso por ID

module.exports = router;
