#!/usr/bin/env node

/**
 * Script para obtener el Refresh Token de Gmail API
 * Este script te ayudará a obtener el refresh token necesario para Gmail API
 */

const { google } = require('googleapis');
const readline = require('readline');

// Configuración OAuth 2.0
const oauth2Client = new google.auth.OAuth2(
    '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    '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',
    'http://localhost:3000/oauth2callback'
);

// Scopes necesarios para Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function obtenerRefreshToken() {
    console.log('🔧 OBTENIENDO REFRESH TOKEN DE GMAIL API');
    console.log('==========================================');
    console.log('');

    try {
        // Generar URL de autorización
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });

        console.log('📋 INSTRUCCIONES:');
        console.log('1. Abre esta URL en tu navegador:');
        console.log('');
        console.log(authUrl);
        console.log('');
        console.log('2. Inicia sesión con tu cuenta de Gmail');
        console.log('3. Autoriza la aplicación');
        console.log('4. Copia el código de autorización de la URL');
        console.log('');

        // Crear interfaz de lectura
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Esperar el código de autorización
        const code = await new Promise((resolve) => {
            rl.question('📝 Pega aquí el código de autorización: ', (answer) => {
                resolve(answer);
            });
        });

        rl.close();

        console.log('');
        console.log('🔄 Intercambiando código por tokens...');

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('✅ Tokens obtenidos exitosamente!');
        console.log('');
        console.log('📋 INFORMACIÓN IMPORTANTE:');
        console.log('========================');
        console.log(`Refresh Token: ${tokens.refresh_token}`);
        console.log('');
        console.log('🔧 CONFIGURACIÓN:');
        console.log('================');
        console.log('Agrega esta línea a tu archivo .env:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('');
        console.log('🎉 ¡Configuración completada!');
        console.log('Ahora puedes usar Gmail API en tu aplicación.');

    } catch (error) {
        console.error('❌ Error obteniendo refresh token:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que el código de autorización sea correcto');
        console.log('2. Verificar que las credenciales OAuth 2.0 estén configuradas');
        console.log('3. Verificar que Gmail API esté habilitado en Google Cloud Console');
    }
}

// Ejecutar script
obtenerRefreshToken();
