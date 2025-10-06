#!/usr/bin/env node

/**
 * Script para obtener Refresh Token de Gmail API con redirect URI funcional
 * Usa un redirect URI que funciona sin configuración adicional
 */

const { google } = require('googleapis');

// Configuración OAuth 2.0 con redirect URI que funciona
const oauth2Client = new google.auth.OAuth2(
    '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    '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',
    'http://localhost:8080/oauth2callback' // Redirect URI que funciona
);

// Scopes necesarios para Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function generarURLAutorizacion() {
    console.log('🔧 GENERANDO URL DE AUTORIZACIÓN PARA GMAIL API (FUNCIONAL)');
    console.log('===========================================================');
    console.log('');

    try {
        // Generar URL de autorización
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });

        console.log('📋 INFORMACIÓN DEL SERVIDOR:');
        console.log('============================');
        console.log(`Servidor: ${process.platform} ${process.arch}`);
        console.log(`Node.js: ${process.version}`);
        console.log(`Directorio: ${process.cwd()}`);
        console.log('');

        console.log('🔑 CREDENCIALES DE GOOGLE:');
        console.log('==========================');
        console.log(`Client ID: 526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com`);
        console.log(`Client Secret: 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`);
        console.log(`Project ID: asistencia-asamblea-api-s2`);
        console.log('');

        console.log('📋 INSTRUCCIONES:');
        console.log('================');
        console.log('1. Abre esta URL en tu navegador:');
        console.log('');
        console.log(authUrl);
        console.log('');
        console.log('2. Inicia sesión con tu cuenta de Gmail');
        console.log('3. Autoriza la aplicación');
        console.log('4. Copia el código de autorización de la URL (después de code=)');
        console.log('5. Ejecuta: node scripts/procesar-codigo-funcional.js [CODIGO]');
        console.log('');

        console.log('🔧 CONFIGURACIÓN EN .env:');
        console.log('=========================');
        console.log('GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com');
        console.log('GOOGLE_CLIENT_SECRET=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');
        console.log('GOOGLE_REDIRECT_URI=http://localhost:8080/oauth2callback');
        console.log('GOOGLE_REFRESH_TOKEN=[OBTENER_CON_EL_CODIGO]');
        console.log('');

        console.log('🎯 PRÓXIMO PASO:');
        console.log('================');
        console.log('Ejecuta: node scripts/procesar-codigo-funcional.js [TU_CODIGO_AQUI]');

    } catch (error) {
        console.error('❌ Error generando URL:', error.message);
    }
}

// Ejecutar script
generarURLAutorizacion();
