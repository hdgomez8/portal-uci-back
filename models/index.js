const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Empleado = require('./Empleado');
const Rol = require('./Rol');
const Permiso = require('./Permiso');
const UsuarioRol = require('./UsuarioRol');
const RolPermiso = require('./RolPermiso');
// Modelos de la estructura organizacional
const Departamento = require('./EstructuraEmpresa/Departamento');   // Por ejemplo, en models/estructura_organizacional/Departamento.js
const Area = require('./EstructuraEmpresa/Area');                       // Por ejemplo, en models/estructura_organizacional/Area.js
const EmpleadoArea = require('./EstructuraEmpresa/EmpleadosAreas');
// Modelos de las Solicitudes
const Solicitud = require('./Solicitudes/Solicitud');
const TipoSolicitud = require('./Solicitudes/TipoSolicitud');
const AdjuntoSolicitud = require('./Solicitudes/AdjuntoSolicitud');
const CambioTurno = require('./Solicitudes/CambioTurno');
const Cesantias = require('./Cesantias')(sequelize);
const Vacaciones = require('./Vacaciones')(sequelize);

// Relaciones
Empleado.hasOne(Usuario, { foreignKey: 'empleado_id', as: 'usuario' });
Usuario.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: 'usuario_id' , as: 'roles' });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: 'rol_id', as: 'usuarios' });
Rol.belongsToMany(Permiso, { through: RolPermiso, foreignKey: 'rol_id' , as: 'permisos'  });
Permiso.belongsToMany(Rol, { through: RolPermiso, foreignKey: 'permiso_id', as: 'roles' });

// Un Departamento pertenece a un Empleado (gerente) y tiene muchas Areas
Departamento.belongsTo(Empleado, { foreignKey: 'gerente_id', as: 'gerente' });
Departamento.hasMany(Area, { foreignKey: 'departamento_id', as: 'areas' });

// Un Area pertenece a un Departamento y tiene asignado un jefe (Empleado)
Area.belongsTo(Departamento, { foreignKey: 'departamento_id', as: 'departamento' });
Area.belongsTo(Empleado, { foreignKey: 'jefe_id', as: 'jefe' });

// Relación muchos a muchos entre Empleado y Area a través de EmpleadoArea
Empleado.belongsToMany(Area, { through: EmpleadoArea, foreignKey: 'empleado_id', as: 'areas' });
Area.belongsToMany(Empleado, { through: EmpleadoArea, foreignKey: 'area_id', as: 'empleados' });

// Relaciones
Solicitud.belongsTo(TipoSolicitud, { foreignKey: 'tipo_solicitud_id',as:'tipo_solicitud' });
Solicitud.belongsTo(Empleado, { foreignKey: 'empleado_id',as:'empleado' });
Solicitud.belongsTo(Usuario, { foreignKey: 'visto_bueno_por',as:'visto_bueno' });

AdjuntoSolicitud.belongsTo(Solicitud, { foreignKey: 'solicitud_id',as:'solicitud' });
Solicitud.hasMany(AdjuntoSolicitud, { foreignKey: 'solicitud_id', as: 'adjuntos' });

const db = {
  Rol, 
  Permiso, 
  UsuarioRol, 
  RolPermiso, 
  Empleado, 
  Usuario, 
  Departamento, 
  Area, 
  EmpleadoArea,
  AdjuntoSolicitud,
  CambioTurno,
  Cesantias,
  Vacaciones
};

Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;