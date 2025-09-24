const { DataTypes } = require('sequelize');
const db = require('../config/database');
const Rol = require('./Rol');
const Permiso = require('./Permiso');

const RolPermiso = db.define('RolPermiso', {
    rol_id: { type: DataTypes.INTEGER, references: { model: Rol, key: 'id' } },
    permiso_id: { type: DataTypes.INTEGER, references: { model: Permiso, key: 'id' } }
}, { tableName: 'roles_permisos', timestamps: false });

module.exports = RolPermiso;
