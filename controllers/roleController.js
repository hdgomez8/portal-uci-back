const { Permiso } = require('../models/Permiso');
const { RolPermiso } = require('../models/RolPermiso');
const Rol = require('../models/Rol');

// Obtener todos los roles con sus permisos
const obtenerRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            include: [{ model: require('../models/Permiso'), as: 'permisos' }]
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener roles', error });
    }
};

// Crear un nuevo rol
const crearRol = async (req, res) => {
    try {
        const { nombre } = req.body;
        const nuevoRol = await Rol.create({ nombre });
        res.status(201).json({ message: 'Rol creado exitosamente', nuevoRol });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear rol', error });
    }
};

// Eliminar un rol
const eliminarRol = async (req, res) => {
    try {
        const { id } = req.params;
        await Rol.destroy({ where: { id } });
        res.json({ message: 'Rol eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar rol', error });
    }
};

// Editar un rol
const editarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const rol = await Rol.findByPk(id);
        if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });
        rol.nombre = nombre;
        await rol.save();
        res.json({ message: 'Rol actualizado exitosamente', rol });
    } catch (error) {
        res.status(500).json({ message: 'Error al editar rol', error });
    }
};

// Asignar permisos a un rol
const asignarPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const { permisos } = req.body; // Array de IDs de permisos
        const rol = await Rol.findByPk(id);
        if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });
        await rol.setPermisos(permisos); // Sequelize magic method
        res.json({ message: 'Permisos asignados correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al asignar permisos', error });
    }
};

// Quitar un permiso de un rol
const quitarPermiso = async (req, res) => {
    try {
        const { id, permisoId } = req.params;
        const rol = await Rol.findByPk(id);
        if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });
        await rol.removePermiso(permisoId); // Sequelize magic method
        res.json({ message: 'Permiso quitado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al quitar permiso', error });
    }
};

module.exports = { obtenerRoles, crearRol, eliminarRol, editarRol, asignarPermisos, quitarPermiso };
