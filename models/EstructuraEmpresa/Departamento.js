const { DataTypes } = require('sequelize');
const db = require('../../config/database');

const Departamento = db.define('Departamento', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  gerente_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  }
}, { 
  tableName: 'departamentos', 
  timestamps: false 
});

module.exports = Departamento;
