const { DataTypes } = require('sequelize');
const db = require('../config/database');
const Usuario = require('./Usuario');
const Rol = require('./Rol');

const UsuarioRol = db.define('UsuarioRol', {
    usuario_id: { type: DataTypes.INTEGER, references: { model: Usuario, key: 'id' } },
    rol_id: { type: DataTypes.INTEGER, references: { model: Rol, key: 'id' } }
}, { tableName: 'usuarios_roles', timestamps: false });

module.exports = UsuarioRol;
