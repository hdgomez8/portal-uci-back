const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('solicitudes', 'ruta_pdf', {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Ruta del archivo PDF generado cuando se aprueba la solicitud'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('solicitudes', 'ruta_pdf');
  }
}; 