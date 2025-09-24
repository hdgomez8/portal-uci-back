const { DataTypes } = require('sequelize');
const db = require('../../config/database');

const Area = db.define('Area', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  departamento_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  jefe_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  }
}, { 
  tableName: 'areas', 
  timestamps: false 
});

module.exports = Area;
