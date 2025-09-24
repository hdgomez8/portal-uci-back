const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Permiso = db.define('Permiso', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { tableName: 'permisos', timestamps: false });

module.exports = Permiso;
