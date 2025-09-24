const express = require('express');
const { obtenerAreas, actualizarArea, crearArea, eliminarArea } = require('../../controllers/EstructuraEmpresa/areaController');

const router = express.Router();


router.get('/', obtenerAreas);
router.put('/:id', actualizarArea);
router.post('/', crearArea);
router.delete('/:id', eliminarArea);

module.exports = router;
