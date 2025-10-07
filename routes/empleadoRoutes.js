const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const uploadCV = require('../middlewares/uploadCV');
const uploadFirma = require('../middlewares/uploadFirma');
const { crearEmpleado, obtenerEmpleados, obtenerEmpleadoPorId, actualizarEmpleado, eliminarEmpleado, subirFoto, subirCV, subirFirma, verificarFirma, eliminarFirma, obtenerEmpleadosPorJefe, actualizarAreaEmpleado, obtenerEmailNotificacion, obtenerEmpleadoPorDocumento, buscarEmpleados, obtenerEmpleadosPorArea, actualizarEstadoEmpleado, obtenerJefeEmpleado, actualizarDocumentoEmpleado } = require('../controllers/empleadoController');

// CRUD
router.post('/', crearEmpleado);
router.get('/', obtenerEmpleados);
router.get('/buscar', buscarEmpleados);
router.get('/documento/:documento', obtenerEmpleadoPorDocumento);
router.get('/:id', obtenerEmpleadoPorId);
router.put('/:id', actualizarEmpleado);
router.delete('/:id', eliminarEmpleado);
router.post('/:id/foto', upload.single('foto_perfil'), subirFoto);
router.post('/:id/upload-cv', uploadCV.single('cv'), subirCV);
router.post('/:id/firma', uploadFirma.single('firma'), subirFirma);
router.get('/:id/firma', verificarFirma);
router.delete('/:id/firma', eliminarFirma);
router.put('/:id/area', actualizarAreaEmpleado);
router.get('/:id/email-notificacion', async (req, res) => {
    try {
        const email = await obtenerEmailNotificacion(req.params.id);
        res.json({ email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/jefe/:jefe_id', obtenerEmpleadosPorJefe);
router.get('/area/:areaId', obtenerEmpleadosPorArea);
router.get('/:empleadoId/jefe', obtenerJefeEmpleado);

// Ruta para actualizar estado del empleado (activar/desactivar)
router.patch('/:id/estado', actualizarEstadoEmpleado);

// Ruta para actualizar documento del empleado
router.patch('/:id/documento', actualizarDocumentoEmpleado);

module.exports = router;
