
// modelos/adjuntoSolicitud.js
const { DataTypes } = require('sequelize');
const db = require('../../config/database');
const Solicitud = require('./Solicitud');

const AdjuntoSolicitud = db.define('AdjuntoSolicitud', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    ruta_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo_mime: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    tamaño: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, { 
    tableName: 'adjuntos_solicitudes',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion' 
});



module.exports = AdjuntoSolicitud;