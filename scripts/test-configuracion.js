#!/usr/bin/env node

/**
 * Script manual para verificar configuración de correos
 * Uso: node scripts/test-configuracion.js
 */

const { verificarConfiguracionCorreos } = require('./verificacion-inicio');

console.log('🚀 Iniciando verificación manual de configuración de correos...');
console.log('📧 Este script enviará un correo de verificación a la dirección configurada');
console.log('⏳ Ejecutando verificación...\n');

verificarConfiguracionCorreos()
  .then(() => {
    console.log('\n✅ Verificación completada exitosamente');
    console.log('📧 Revisa tu correo para confirmar que la configuración funciona');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la verificación:', error.message);
    console.error('🔍 Revisa la configuración y los logs para más detalles');
    process.exit(1);
  });
