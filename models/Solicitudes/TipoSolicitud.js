// modelos/tipoSolicitud.js
const { DataTypes } = require('sequelize');
const db = require('../../config/database');

const TipoSolicitud = db.define('TipoSolicitud', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    requiere_visto_bueno: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, { 
    tableName: 'tipos_solicitud',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion' 
});

module.exports = TipoSolicitud;