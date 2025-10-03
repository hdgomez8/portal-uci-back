const { Sequelize } = require('sequelize');
require('dotenv').config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log, // Habilitar logging para debugging
    pool: {
      max: 10,        // Máximo 10 conexiones
      min: 0,         // Mínimo 0 conexiones
      acquire: 30000, // Tiempo máximo para obtener conexión (30 segundos)
      idle: 10000     // Tiempo máximo que una conexión puede estar inactiva (10 segundos)
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

module.exports = db;
