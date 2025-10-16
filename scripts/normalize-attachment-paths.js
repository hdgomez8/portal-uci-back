const AdjuntoSolicitud = require('../models/Solicitudes/AdjuntoSolicitud');
const path = require('path');

async function normalizeAttachmentPaths() {
  try {
    console.log('🔍 Iniciando normalización de rutas de adjuntos...');
    
    // Obtener todos los adjuntos
    const adjuntos = await AdjuntoSolicitud.findAll();
    console.log(`📋 Encontrados ${adjuntos.length} adjuntos para normalizar`);
    
    let normalizedCount = 0;
    
    for (const adjunto of adjuntos) {
      const rutaOriginal = adjunto.ruta_archivo;
      console.log(`🔍 Procesando: ${rutaOriginal}`);
      
      // Si la ruta es absoluta (contiene /var/www/html/portal-uci-back/), normalizarla
      if (rutaOriginal.includes('/var/www/html/portal-uci-back/')) {
        // Extraer solo la parte relativa después de /uploads/
        const uploadsIndex = rutaOriginal.indexOf('/uploads/');
        if (uploadsIndex !== -1) {
          const rutaRelativa = rutaOriginal.substring(uploadsIndex + 1); // +1 para quitar la barra inicial
          console.log(`  ✅ Normalizando: ${rutaOriginal} -> ${rutaRelativa}`);
          
          await adjunto.update({ ruta_archivo: rutaRelativa });
          normalizedCount++;
        } else {
          console.log(`  ⚠️ No se pudo normalizar: ${rutaOriginal}`);
        }
      } else if (rutaOriginal.startsWith('uploads/')) {
        // Si ya es relativa pero empieza con 'uploads/', quitar el prefijo
        const rutaRelativa = rutaOriginal.substring('uploads/'.length);
        console.log(`  ✅ Normalizando prefijo: ${rutaOriginal} -> ${rutaRelativa}`);
        
        await adjunto.update({ ruta_archivo: rutaRelativa });
        normalizedCount++;
      } else {
        console.log(`  ✅ Ya normalizada: ${rutaOriginal}`);
      }
    }
    
    console.log(`✅ Normalización completada. ${normalizedCount} rutas actualizadas.`);
    
  } catch (error) {
    console.error('❌ Error normalizando rutas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  normalizeAttachmentPaths()
    .then(() => {
      console.log('🎉 Script completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { normalizeAttachmentPaths };
