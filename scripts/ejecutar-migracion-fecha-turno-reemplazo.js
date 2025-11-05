const db = require('../config/database');
const { QueryInterface } = require('sequelize');
const { Sequelize } = require('sequelize');

async function ejecutarMigracion() {
  try {
    console.log('🔄 Iniciando migración: agregar fecha_turno_reemplazo...');
    
    // Conectar a la base de datos
    await db.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    const queryInterface = db.getQueryInterface();
    
    // Verificar si la columna ya existe
    const [results] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'solicitudes_cambio_turno' 
      AND COLUMN_NAME = 'fecha_turno_reemplazo'
    `);
    
    if (results.length > 0) {
      console.log('⚠️ La columna fecha_turno_reemplazo ya existe en la tabla');
      process.exit(0);
    }
    
    // Ejecutar la migración
    await queryInterface.addColumn('solicitudes_cambio_turno', 'fecha_turno_reemplazo', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha en que se realizará el turno de reemplazo'
    });
    
    console.log('✅ Migración ejecutada exitosamente: fecha_turno_reemplazo agregado');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

ejecutarMigracion();

