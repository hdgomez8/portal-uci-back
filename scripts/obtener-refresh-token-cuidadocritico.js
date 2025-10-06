#!/usr/bin/env node

/**
 * Script para obtener Refresh Token de Gmail API con dominio cuidadocritico.com.co
 * Usa el dominio real del proyecto
 */

const { google } = require('googleapis');

// Configuración OAuth 2.0 con dominio real
const oauth2Client = new google.auth.OAuth2(
    '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    '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',
    'https://cuidadocritico.com.co' // Solo el dominio, sin ruta
);

// Scopes necesarios para Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function generarURLAutorizacion() {
    console.log('🔧 GENERANDO URL DE AUTORIZACIÓN PARA GMAIL API (DOMINIO REAL)');
    console.log('=============================================================');
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
        console.log(`Dominio: cuidadocritico.com.co`);
        console.log('');

        console.log('🔑 CREDENCIALES DE GOOGLE:');
        console.log('==========================');
        console.log(`Client ID: 526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com`);
        console.log(`Client Secret: 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`);
        console.log(`Project ID: asistencia-asamblea-api-s2`);
        console.log(`Redirect URI: https://cuidadocritico.com.co`);
        console.log('');

        console.log('📋 INSTRUCCIONES:');
        console.log('================');
        console.log('1. PRIMERO: Configura el redirect URI en Google Cloud Console');
        console.log('   - Ve a: https://console.cloud.google.com/');
        console.log('   - Proyecto: asistencia-asamblea-api-s2');
        console.log('   - APIs & Services → Credentials');
        console.log('   - Editar OAuth 2.0 Client ID');
        console.log('   - Agregar: https://cuidadocritico.com.co');
        console.log('   - Guardar cambios');
        console.log('');
        console.log('2. Abre esta URL en tu navegador:');
        console.log('');
        console.log(authUrl);
        console.log('');
        console.log('3. Inicia sesión con tu cuenta de Gmail');
        console.log('4. Autoriza la aplicación');
        console.log('5. Copia el código de autorización de la URL (después de code=)');
        console.log('6. Ejecuta: node scripts/procesar-codigo-cuidadocritico.js [CODIGO]');
        console.log('');

        console.log('🔧 CONFIGURACIÓN EN .env:');
        console.log('=========================');
        console.log('GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com');
        console.log('GOOGLE_CLIENT_SECRET=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');
        console.log('GOOGLE_REDIRECT_URI=https://cuidadocritico.com.co');
        console.log('GOOGLE_REFRESH_TOKEN=[OBTENER_CON_EL_CODIGO]');
        console.log('');

        console.log('🎯 PRÓXIMO PASO:');
        console.log('================');
        console.log('1. Configura el redirect URI en Google Cloud Console');
        console.log('2. Ejecuta: node scripts/procesar-codigo-cuidadocritico.js [TU_CODIGO_AQUI]');

    } catch (error) {
        console.error('❌ Error generando URL:', error.message);
    }
}

// Ejecutar script
generarURLAutorizacion();
