const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cesantias = sequelize.define('Cesantias', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    empleado_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empleados',
        key: 'id'
      }
    },
    correo_solicitante: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nombre_colaborador: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tipo_identificacion: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    numero_identificacion: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fecha_solicitud: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tipo_retiro: {
      type: DataTypes.ENUM('carta_banco', 'consignacion_cuenta'),
      allowNull: false
    },
    // Datos bancarios (si aplica)
    entidad_bancaria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo_cuenta: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    numero_cuenta: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Archivos adjuntos
    solicitud_cesantias_pdf: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    copia_cedula_solicitante: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    copia_cedula_conyuge: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    predial_certificado: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fotos_reforma: {
      type: DataTypes.TEXT, // JSON array de URLs
      allowNull: true
    },
    cotizacion_materiales: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    promesa_compraventa: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cedula_vendedor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Estado y seguimiento
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_revision', 'aprobado_por_admin', 'aprobado', 'rechazado'),
      defaultValue: 'pendiente',
      allowNull: false
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_revision: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revisado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'empleados',
        key: 'id'
      }
    },
    monto_solicitado: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    monto_aprobado: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    motivo_rechazo: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'solicitudes_cesantias',
    timestamps: true,
    paranoid: true, // Soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  Cesantias.associate = (models) => {
    Cesantias.belongsTo(models.Empleado, {
      foreignKey: 'empleado_id',
      as: 'empleado'
    });
    
    Cesantias.belongsTo(models.Empleado, {
      foreignKey: 'revisado_por',
      as: 'revisor'
    });
  };

  return Cesantias;
}; 