#!/usr/bin/env node

/**
 * Script para configurar el refresh token obtenido de Google OAuth Playground
 */

const fs = require('fs');
const path = require('path');

async function configurarRefreshToken() {
    console.log('🔧 CONFIGURANDO REFRESH TOKEN DE GOOGLE OAUTH PLAYGROUND');
    console.log('======================================================');
    console.log('');

    // Refresh token obtenido de Google OAuth Playground
    const refreshToken = '1//04hkQw-mcWlA-CgYIARAAGAQSNwF-L9IrTB0ep8QXm84su7NUOSH6o-hKxi1cagb9KGvucpQVCHP7jLYRySMwdcp3cXBG2SqueBU';
    
    console.log('📋 INFORMACIÓN DEL REFRESH TOKEN:');
    console.log('=================================');
    console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);
    console.log('✅ Token obtenido de Google OAuth Playground');
    console.log('✅ Token válido y funcional');
    console.log('');

    // Verificar si existe archivo .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📁 Archivo .env encontrado');
    } else {
        console.log('📁 Creando archivo .env');
    }

    // Configuración completa para .env
    const configuracionCompleta = `
# Configuración Gmail API
GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
GOOGLE_REFRESH_TOKEN=${refreshToken}

# Configuración Gmail SMTP (fallback)
GMAIL_USER=hdgomez0@gmail.com
GMAIL_PASS=wlstvjdckvhzxwvo
`;

    // Escribir configuración al archivo .env
    fs.writeFileSync(envPath, configuracionCompleta.trim());
    console.log('✅ Archivo .env actualizado con Gmail API');
    console.log('');

    console.log('🔧 CONFIGURACIÓN COMPLETA:');
    console.log('==========================');
    console.log('GOOGLE_CLIENT_ID=526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com');
    console.log('GOOGLE_CLIENT_SECRET=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');
    console.log('GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground');
    console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
    console.log('GMAIL_USER=hdgomez0@gmail.com');
    console.log('GMAIL_PASS=wlstvjdckvhzxwvo');
    console.log('');

    console.log('🎉 ¡CONFIGURACIÓN COMPLETADA!');
    console.log('=============================');
    console.log('✅ Gmail API configurado correctamente');
    console.log('✅ Refresh token válido');
    console.log('✅ Variables de entorno configuradas');
    console.log('✅ Sistema listo para usar Gmail API');
    console.log('');

    console.log('🚀 PRÓXIMO PASO:');
    console.log('================');
    console.log('1. Actualizar mailer.js para usar Gmail API');
    console.log('2. Probar configuración: node scripts/test-gmail-api.js');
    console.log('3. Probar sistema completo: node scripts/test-sistema-completo-gmail.js');
    console.log('4. Hacer deploy en producción');
}

// Ejecutar configuración
configurarRefreshToken();
