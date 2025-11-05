'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('solicitudes_cambio_turno', 'fecha_turno_reemplazo', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha en que se realizará el turno de reemplazo'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('solicitudes_cambio_turno', 'fecha_turno_reemplazo');
  }
};

