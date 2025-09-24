const Rol = require('../models/Rol');

// Obtener todos los roles
const obtenerRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            order: [['nombre', 'ASC']]
        });
        
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ 
            message: 'Error al obtener roles', 
            error: error.message 
        });
    }
};

// Obtener rol por ID
const obtenerRolPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const rol = await Rol.findByPk(id);
        
        if (!rol) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }
        
        res.json(rol);
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            message: 'Error al obtener rol', 
            error: error.message 
        });
    }
};

module.exports = {
    obtenerRoles,
    obtenerRolPorId
}; 