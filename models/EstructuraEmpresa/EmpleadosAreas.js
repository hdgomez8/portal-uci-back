const { DataTypes } = require('sequelize');
const db = require('../../config/database');

const EmpleadoArea = db.define('EmpleadoArea', {
  empleado_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true 
  },
  area_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true 
  }
}, {
  tableName: 'empleados_areas',
  timestamps: false
});

// Definir las asociaciones
EmpleadoArea.associate = (models) => {
  EmpleadoArea.belongsTo(models.Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
  EmpleadoArea.belongsTo(models.Area, { foreignKey: 'area_id', as: 'area' });
};

module.exports = EmpleadoArea;
