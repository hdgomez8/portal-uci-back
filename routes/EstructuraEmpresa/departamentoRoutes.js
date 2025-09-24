const express = require('express');
const { obtenerDepartamentos, actualizarDepartamento, crearDepartamento, eliminarDepartamento } = require('../../controllers/EstructuraEmpresa/departamentoController');
const { verificarToken } = require('../../middlewares/authMiddleware');
const checkPermissions = require('../../middlewares/checkPermissions');

const router = express.Router();

// Ruta para login
router.get('/', obtenerDepartamentos);
router.put('/:id', verificarToken, checkPermissions(['EDITAR_DEPARTAMENTOS']), actualizarDepartamento);
router.post('/', crearDepartamento);
router.delete('/:id', eliminarDepartamento);

module.exports = router;
