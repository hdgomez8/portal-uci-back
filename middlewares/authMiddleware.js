const jwt = require('jsonwebtoken');
const { Usuario, Rol, UsuarioRol } = require('../models');

const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado correctamente' });
    }

    try {
        const token = authHeader.split(" ")[1]; // 🔹 Extraer solo el token después de "Bearer"
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error("❌ Error al verificar token:", error.message);
        res.status(400).json({ message: 'Token inválido', error: error.message });
    }
};

const verificarRol = (rolesPermitidos) => {
    return async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.usuario.id, {
                include: [{ model: Rol, as: 'roles' }]
            });

            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            const rolesUsuario = usuario.roles.map(rol => rol.nombre);
            const tieneAcceso = rolesPermitidos.some(rol => rolesUsuario.includes(rol));

            if (!tieneAcceso) {
                return res.status(403).json({ message: 'Acceso denegado. No tienes permisos' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Error en la validación de roles', error });
        }
    };
};

module.exports = { verificarToken, verificarRol };
