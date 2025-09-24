const express = require('express');
const { obtenerRoles, crearRol, eliminarRol, editarRol, asignarPermisos, quitarPermiso } = require('../controllers/roleController');

const router = express.Router();

router.get('/', obtenerRoles);  // Obtener todos los roles
router.post('/', crearRol);  // Crear un nuevo rol
router.delete('/:id', eliminarRol);  // Eliminar un rol por ID
router.put('/:id', editarRol);  // Editar un rol por ID
router.post('/:id/permisos', asignarPermisos);  // Asignar permisos a un rol
router.delete('/:id/permisos/:permisoId', quitarPermiso);  // Quitar un permiso de un rol

module.exports = router;
