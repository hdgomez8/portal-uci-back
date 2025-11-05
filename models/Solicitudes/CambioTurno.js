const { DataTypes } = require('sequelize');
const db = require('../../config/database');
const Empleado = require('../Empleado');

const CambioTurno = db.define('CambioTurno', {
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
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Fecha en que se realizará el cambio de turno'
    },
    fecha_turno_reemplazo: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que se realizará el turno de reemplazo'
    },
    horario_cambiar: {
        type: DataTypes.STRING(100)
    },
    horario_reemplazo: {
        type: DataTypes.STRING(100)
    },
    motivo: {
        type: DataTypes.TEXT
    },
    nombre_reemplazo: {
        type: DataTypes.STRING(255)
    },
    cedula_reemplazo: {
        type: DataTypes.STRING(50)
    },
    afectacion_nomina: {
        type: DataTypes.STRING(10)
    },
    soporte: {
        type: DataTypes.STRING(255)
    },
    correo: {
        type: DataTypes.STRING(255)
    },
    observaciones: {
        type: DataTypes.TEXT
    },
    estado: {
        type: DataTypes.STRING(50),
        defaultValue: 'Pendiente'
    },
    visto_bueno_reemplazo: {
        type: DataTypes.STRING(20),
        defaultValue: 'Pendiente'
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'solicitudes_cambio_turno',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at'
});

// Definir asociaciones
CambioTurno.belongsTo(Empleado, {
    foreignKey: 'empleado_id',
    as: 'empleado'
});

module.exports = CambioTurno; 