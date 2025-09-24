const { Usuario, Rol, Permiso } = require('../models');

// Middleware para verificar permisos
const checkPermissions = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Buscar el usuario autenticado e incluir roles y permisos
      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{
          model: Rol,
          as: 'roles',
          include: [{
            model: Permiso,
            as: 'permisos'
          }]
        }]
      });

      if (!usuario) {
        return res.status(401).json({ message: 'Usuario no encontrado o no autenticado. Por favor, inicia sesión nuevamente.' });
      }

      // Obtener todos los permisos del usuario
      const userPermissions = usuario.roles.flatMap(rol =>
        rol.permisos.map(permiso => permiso.nombre)
      );

      // Si tiene el permiso requerido, continuar
      const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
      if (!hasPermission) {
        const response = {
          status: 'error',
          error: 'PERMISSION_DENIED',
          message: 'No tienes permisos suficientes para realizar esta acción. Si crees que esto es un error, contacta al administrador.'
        };
        if (process.env.NODE_ENV !== 'production') {
          response.details = {
            requiredPermissions,
            userPermissions
          };
        }
        return res.status(403).json(response);
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error de permisos' });
    }
  };
};

module.exports = checkPermissions; 