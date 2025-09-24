const express = require('express');
const { crearUsuario, editarUsuario, deshabilitarUsuario, obtenerUsuarios, actualizarRolUsuario, eliminarUsuario } = require('../controllers/userController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas de gestión de usuarios
router.post('/usuarios', verificarToken, verificarRol(['ADMINISTRADOR']), crearUsuario); // Crear usuario
router.put('/usuarios/:id', verificarToken, verificarRol(['ADMINISTRADOR']), editarUsuario); // Editar usuario
router.put('/usuarios/deshabilitar/:id', verificarToken, verificarRol(['ADMINISTRADOR']), deshabilitarUsuario); // Deshabilitar usuario
router.get('/usuarios', verificarToken, verificarRol(['ADMINISTRADOR', 'SUPERADMIN']), obtenerUsuarios); // Obtener Usuarios
router.put('/usuarios/:id/rol', verificarToken, verificarRol(['ADMINISTRADOR']), actualizarRolUsuario); // Actualizar rol de usuario
router.delete('/usuarios/:id', verificarToken, verificarRol(['ADMINISTRADOR']), eliminarUsuario); // Eliminar usuario y empleado

module.exports = router;
