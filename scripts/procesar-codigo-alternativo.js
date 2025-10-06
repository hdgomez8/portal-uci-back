#!/usr/bin/env node

/**
 * Script para procesar el código de autorización con método alternativo
 * Uso: node scripts/procesar-codigo-alternativo.js [CODIGO_DE_AUTORIZACION]
 */

const { google } = require('googleapis');

// Configuración OAuth 2.0 con método alternativo
const oauth2Client = new google.auth.OAuth2(
    '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    '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',
    'urn:ietf:wg:oauth:2.0:oob'
);

async function procesarCodigoAlternativo(codigo) {
    console.log('🔧 PROCESANDO CÓDIGO CON MÉTODO ALTERNATIVO');
    console.log('==========================================');
    console.log('');

    if (!codigo) {
        console.log('❌ Error: No se proporcionó código de autorización');
        console.log('');
        console.log('📋 USO CORRECTO:');
        console.log('node scripts/procesar-codigo-alternativo.js [TU_CODIGO_AQUI]');
        console.log('');
        console.log('📋 EJEMPLO:');
        console.log('node scripts/procesar-codigo-alternativo.js 4/0AX4XfWh...');
        return;
    }

    try {
        console.log('🔄 Intercambiando código por tokens...');
        console.log(`Código: ${codigo.substring(0, 20)}...`);

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(codigo);
        
        console.log('✅ Tokens obtenidos exitosamente!');
        console.log('');
        console.log('📋 INFORMACIÓN IMPORTANTE:');
        console.log('========================');
        console.log(`Refresh Token: ${tokens.refresh_token}`);
        console.log('');
        console.log('🔧 CONFIGURACIÓN COMPLETA PARA .env:');
        console.log('===================================');
        console.log('Agrega estas líneas a tu archivo .env:');
        console.log('');
        console.log('GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com');
        console.log('GOOGLE_CLIENT_SECRET=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');
        console.log('GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('');
        console.log('🎉 ¡Configuración completada!');
        console.log('Ahora puedes usar Gmail API en tu servidor.');
        console.log('');
        console.log('🚀 PRÓXIMO PASO:');
        console.log('================');
        console.log('1. Actualiza tu archivo .env con las variables de arriba');
        console.log('2. Ejecuta: node scripts/test-gmail-api-final.js');

    } catch (error) {
        console.error('❌ Error procesando código:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que el código de autorización sea correcto');
        console.log('2. Verificar que las credenciales OAuth 2.0 estén configuradas');
        console.log('3. Verificar que Gmail API esté habilitado en Google Cloud Console');
        console.log('4. Intentar generar un nuevo código de autorización');
        console.log('5. Verificar que el redirect URI esté configurado en Google Cloud Console');
    }
}

// Obtener código de los argumentos de línea de comandos
const codigo = process.argv[2];

// Ejecutar script
procesarCodigoAlternativo(codigo);
