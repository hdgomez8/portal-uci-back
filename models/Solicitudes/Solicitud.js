// modelos/solicitud.js
const { DataTypes } = require('sequelize');
const db = require('../../config/database');
const Empleado = require('../Empleado');
const TipoSolicitud = require('./TipoSolicitud');

const Solicitud = db.define('Solicitud', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    empleado_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Empleado,
            key: 'id'
        }
    },
    tipo_solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TipoSolicitud,
            key: 'id'
        }
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    duracion: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    observaciones: {
        type: DataTypes.TEXT
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'visto_bueno', 'aprobado', 'rechazado'),
        defaultValue: 'pendiente'
    },
    motivo: {
        type: DataTypes.STRING(255)
    },
    fecha_visto_bueno: {
        type: DataTypes.DATE
    },
    visto_bueno_por: {
        type: DataTypes.STRING(255)
    },
    ruta_pdf: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Ruta del archivo PDF generado cuando se aprueba la solicitud'
    }
}, { 
    tableName: 'solicitudes',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    deletedAt: 'fecha_eliminacion',
    paranoid: true 
});

module.exports = Solicitud;
