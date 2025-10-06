#!/usr/bin/env node

/**
 * Script para configurar Gmail API con método alternativo
 * Usa diferentes redirect URIs para evitar el error
 */

const { google } = require('googleapis');

// Configuración OAuth 2.0 con método alternativo
const oauth2Client = new google.auth.OAuth2(
    '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    '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',
    'urn:ietf:wg:oauth:2.0:oob' // Método alternativo que siempre funciona
);

// Scopes necesarios para Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function configurarGmailAPIAlternativo() {
    console.log('🔧 CONFIGURANDO GMAIL API (MÉTODO ALTERNATIVO)');
    console.log('============================================');
    console.log('');

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

    console.log('🚀 MÉTODO ALTERNATIVO:');
    console.log('=====================');
    console.log('✅ Usa redirect URI: urn:ietf:wg:oauth:2.0:oob');
    console.log('✅ No requiere configuración de dominios');
    console.log('✅ Siempre funciona sin errores');
    console.log('✅ Método estándar para aplicaciones de escritorio');
    console.log('');

    try {
        // Generar URL de autorización
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });

        console.log('📋 INSTRUCCIONES:');
        console.log('================');
        console.log('1. Abre esta URL en tu navegador:');
        console.log('');
        console.log(authUrl);
        console.log('');
        console.log('2. Inicia sesión con tu cuenta de Gmail');
        console.log('3. Autoriza la aplicación');
        console.log('4. Se mostrará el código de autorización en la página');
        console.log('5. Copia el código de autorización');
        console.log('6. Ejecuta: node scripts/procesar-codigo-alternativo.js [CODIGO]');
        console.log('');

        console.log('🔧 CONFIGURACIÓN EN .env:');
        console.log('=========================');
        console.log('GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com');
        console.log('GOOGLE_CLIENT_SECRET=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');
        console.log('GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob');
        console.log('GOOGLE_REFRESH_TOKEN=[OBTENER_CON_EL_CODIGO]');
        console.log('');

        console.log('🎯 PRÓXIMO PASO:');
        console.log('================');
        console.log('Ejecuta: node scripts/procesar-codigo-alternativo.js [TU_CODIGO_AQUI]');

    } catch (error) {
        console.error('❌ Error configurando Gmail API:', error.message);
    }
}

// Ejecutar script
configurarGmailAPIAlternativo();
