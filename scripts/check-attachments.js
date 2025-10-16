const AdjuntoSolicitud = require('../models/Solicitudes/AdjuntoSolicitud');

async function checkAttachments() {
  try {
    console.log('🔍 Verificando adjuntos en la base de datos...');
    
    const adjuntos = await AdjuntoSolicitud.findAll();
    console.log(`📋 Encontrados ${adjuntos.length} adjuntos:`);
    
    adjuntos.forEach((adjunto, index) => {
      console.log(`${index + 1}. ID: ${adjunto.id}`);
      console.log(`   Ruta: ${adjunto.ruta_archivo}`);
      console.log(`   Nombre: ${adjunto.nombre_archivo}`);
      console.log(`   Tipo: ${adjunto.tipo_mime}`);
      console.log(`   Tamaño: ${adjunto.tamaño} bytes`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error verificando adjuntos:', error);
  }
}

checkAttachments()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
