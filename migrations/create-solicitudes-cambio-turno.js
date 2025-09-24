module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('solicitudes_cambio_turno', {
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
        }
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      horario_cambiar: {
        type: Sequelize.STRING(100)
      },
      horario_reemplazo: {
        type: Sequelize.STRING(100)
      },
      motivo: {
        type: Sequelize.TEXT
      },
      nombre_reemplazo: {
        type: Sequelize.STRING(255)
      },
      cedula_reemplazo: {
        type: Sequelize.STRING(50)
      },
      afectacion_nomina: {
        type: Sequelize.STRING(10)
      },
      soporte: {
        type: Sequelize.STRING(255)
      },
      correo: {
        type: Sequelize.STRING(255)
      },
      observaciones: {
        type: Sequelize.TEXT
      },
      estado: {
        type: Sequelize.STRING(50),
        defaultValue: 'Pendiente'
      },
      visto_bueno_reemplazo: {
        type: Sequelize.STRING(20),
        defaultValue: 'Pendiente'
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      fecha_actualizacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('solicitudes_cambio_turno');
  }
}; 