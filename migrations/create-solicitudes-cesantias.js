'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('solicitudes_cesantias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'empleados',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      correo_solicitante: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      nombre_colaborador: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo_identificacion: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      numero_identificacion: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      fecha_solicitud: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      tipo_retiro: {
        type: Sequelize.ENUM('carta_banco', 'consignacion_cuenta'),
        allowNull: false
      },
      entidad_bancaria: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tipo_cuenta: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      numero_cuenta: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      solicitud_cesantias_pdf: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      copia_cedula_solicitante: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      copia_cedula_conyuge: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      predial_certificado: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      fotos_reforma: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cotizacion_materiales: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      promesa_compraventa: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      cedula_vendedor: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_revision', 'aprobado', 'rechazado'),
        defaultValue: 'pendiente',
        allowNull: false
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_revision: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revisado_por: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'empleados',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      monto_solicitado: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      monto_aprobado: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      motivo_rechazo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('solicitudes_cesantias', ['empleado_id']);
    await queryInterface.addIndex('solicitudes_cesantias', ['estado']);
    await queryInterface.addIndex('solicitudes_cesantias', ['fecha_solicitud']);
    await queryInterface.addIndex('solicitudes_cesantias', ['deleted_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('solicitudes_cesantias');
  }
}; 