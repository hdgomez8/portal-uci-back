#!/usr/bin/env node

/**
 * Script para generar URL de autorización de Gmail API
 */

const { google } = require('googleapis');
require('dotenv').config();

function generarURLAutorizacion() {
    console.log('🔧 CONFIGURACIÓN GMAIL API - PLAYGROUND');
    console.log('========================================');
    console.log('');

    // Configuración OAuth 2.0
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
        process.env.GOOGLE_CLIENT_SECRET || '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',
        process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );

    // Scopes necesarios para Gmail API
    const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
    ];

    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    console.log('📋 INFORMACIÓN DE CONFIGURACIÓN:');
    console.log('================================');
    console.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID || 'NO CONFIGURADO'}`);
    console.log(`Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
    console.log(`Redirect URI: ${process.env.GOOGLE_REDIRECT_URI || 'NO CONFIGURADO'}`);
    console.log('');

    console.log('🔗 URL DE AUTORIZACIÓN:');
    console.log('======================');
    console.log(authUrl);
    console.log('');

    console.log('📋 INSTRUCCIONES:');
    console.log('=================');
    console.log('1. Copia la URL de arriba');
    console.log('2. Ábrela en tu navegador');
    console.log('3. Autoriza la aplicación');
    console.log('4. Copia el código de autorización');
    console.log('5. Ejecuta: node scripts/procesar-codigo-playground.js');
    console.log('');

    console.log('⚠️ IMPORTANTE:');
    console.log('==============');
    console.log('- Asegúrate de que el Redirect URI esté configurado en Google Cloud Console');
    console.log('- El Redirect URI debe ser: https://developers.google.com/oauthplayground');
    console.log('- Si no tienes acceso a Google Cloud Console, usa el método alternativo');
    console.log('');

    return authUrl;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generarURLAutorizacion();
}

module.exports = { generarURLAutorizacion };
