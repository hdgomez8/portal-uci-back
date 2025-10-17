const jwt = require('jsonwebtoken');
const { Usuario, Rol, UsuarioRol } = require('../models');

const verificarToken = (req, res, next) => {
    console.log('🔍 DEBUG - Verificando token de autenticación');
    console.log('  - URL:', req.originalUrl);
    console.log('  - Método:', req.method);
    console.log('  - Headers Authorization:', req.header('Authorization') ? 'Presente' : 'Ausente');
    
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Token no proporcionado correctamente');
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado correctamente' });
    }

    try {
        const token = authHeader.split(" ")[1]; // 🔹 Extraer solo el token después de "Bearer"
        console.log('🔍 Token extraído:', token ? 'Presente' : 'Ausente');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token válido, usuario:', decoded.id);
        
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error("❌ Error al verificar token:", error.message);
        console.error("❌ Tipo de error:", error.name);
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
