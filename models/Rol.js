const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Rol = db.define('Rol', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { tableName: 'roles', timestamps: false });

module.exports = Rol;
