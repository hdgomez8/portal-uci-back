const Permiso = require('../models/Permiso');

// Obtener todos los permisos
const obtenerPermisos = async (req, res) => {
    try {
        const permisos = await Permiso.findAll();
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener permisos', error });
    }
};

// Crear un nuevo permiso
const crearPermiso = async (req, res) => {
    try {
        const { nombre } = req.body;
        const nuevoPermiso = await Permiso.create({ nombre });
        res.status(201).json({ message: 'Permiso creado exitosamente', nuevoPermiso });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear permiso', error });
    }
};

// Eliminar un permiso
const eliminarPermiso = async (req, res) => {
    try {
        const { id } = req.params;
        await Permiso.destroy({ where: { id } });
        res.json({ message: 'Permiso eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar permiso', error });
    }
};

module.exports = { obtenerPermisos, crearPermiso, eliminarPermiso };
