const TipoSolicitud = require('../../models/Solicitudes/TipoSolicitud');

// Obtener todos los tipos de solicitud
const obtenerTiposSolicitud = async (req, res) => {
    try {
        const tipos = await TipoSolicitud.findAll();
        res.json(tipos);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener tipos de solicitud',
            error: error.message 
        });
    }
};

// Crear nuevo tipo de solicitud
const crearTipoSolicitud = async (req, res) => {
    try {
        const { nombre, descripcion, requiere_visto_bueno } = req.body;
        
        const nuevoTipo = await TipoSolicitud.create({
            nombre,
            descripcion,
            requiere_visto_bueno: requiere_visto_bueno || true
        });
        
        res.status(201).json({
            message: 'Tipo de solicitud creado exitosamente',
            data: nuevoTipo
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear tipo de solicitud',
            error: error.message
        });
    }
};

// Actualizar tipo de solicitud
const actualizarTipoSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, requiere_visto_bueno } = req.body;
        
        const tipoActualizado = await TipoSolicitud.update({
            nombre,
            descripcion,
            requiere_visto_bueno
        }, {
            where: { id },
            returning: true
        });
        
        if(tipoActualizado[0] === 0) {
            return res.status(404).json({ message: 'Tipo de solicitud no encontrado' });
        }
        
        res.json({
            message: 'Tipo de solicitud actualizado',
            data: tipoActualizado[1][0]
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar tipo de solicitud',
            error: error.message
        });
    }
};

// Eliminar tipo de solicitud
const eliminarTipoSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await TipoSolicitud.destroy({ where: { id } });
        
        if(resultado === 0) {
            return res.status(404).json({ message: 'Tipo de solicitud no encontrado' });
        }
        
        res.json({ message: 'Tipo de solicitud eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar tipo de solicitud',
            error: error.message
        });
    }
};

module.exports = {
    obtenerTiposSolicitud,
    crearTipoSolicitud,
    actualizarTipoSolicitud,
    eliminarTipoSolicitud
};