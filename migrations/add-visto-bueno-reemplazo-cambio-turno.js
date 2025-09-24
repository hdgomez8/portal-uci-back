'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('solicitudes_cambio_turno', 'visto_bueno_reemplazo', {
      type: Sequelize.STRING(20),
      defaultValue: 'Pendiente',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('solicitudes_cambio_turno', 'visto_bueno_reemplazo');
  }
}; 