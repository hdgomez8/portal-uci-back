#!/usr/bin/env node

/**
 * Script para procesar código de autorización de Gmail API
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function procesarCodigoAutorizacion(codigo) {
    console.log('🔧 PROCESANDO CÓDIGO DE AUTORIZACIÓN');
    console.log('====================================');
    console.log('');

    try {
        // Configuración OAuth 2.0
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
            process.env.GOOGLE_CLIENT_SECRET || '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',
            process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );

        console.log('📋 CONFIGURACIÓN:');
        console.log('=================');
        console.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID || 'NO CONFIGURADO'}`);
        console.log(`Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
        console.log(`Redirect URI: ${process.env.GOOGLE_REDIRECT_URI || 'NO CONFIGURADO'}`);
        console.log(`Código: ${codigo ? '***PROVIDED***' : 'NO PROPORCIONADO'}`);
        console.log('');

        if (!codigo) {
            console.log('❌ ERROR: No se proporcionó código de autorización');
            console.log('');
            console.log('💡 USO:');
            console.log('node scripts/procesar-codigo-playground.js "TU_CODIGO_AQUI"');
            console.log('');
            console.log('🔗 Obtener código:');
            console.log('node scripts/configurar-gmail-playground.js');
            return false;
        }

        console.log('🔄 Intercambiando código por tokens...');
        
        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(codigo);
        
        console.log('✅ Tokens obtenidos exitosamente');
        console.log('');

        console.log('📋 INFORMACIÓN DE TOKENS:');
        console.log('=========================');
        console.log(`Access Token: ${tokens.access_token ? '***OBTENIDO***' : 'NO OBTENIDO'}`);
        console.log(`Refresh Token: ${tokens.refresh_token ? '***OBTENIDO***' : 'NO OBTENIDO'}`);
        console.log(`Token Type: ${tokens.token_type || 'N/A'}`);
        console.log(`Expires In: ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A'}`);
        console.log('');

        if (tokens.refresh_token) {
            console.log('🔧 ACTUALIZANDO ARCHIVO .env:');
            console.log('============================');
            
            // Leer archivo .env actual
            const envPath = path.join(process.cwd(), '.env');
            let envContent = '';
            
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
            
            // Actualizar o agregar GOOGLE_REFRESH_TOKEN
            const refreshTokenLine = `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
            
            if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
                // Reemplazar línea existente
                envContent = envContent.replace(
                    /GOOGLE_REFRESH_TOKEN=.*/,
                    refreshTokenLine
                );
            } else {
                // Agregar nueva línea
                envContent += `\n${refreshTokenLine}\n`;
            }
            
            // Escribir archivo actualizado
            fs.writeFileSync(envPath, envContent);
            
            console.log('✅ Archivo .env actualizado');
            console.log(`✅ Refresh Token: ${tokens.refresh_token}`);
            console.log('');
            
            console.log('🧪 PROBANDO GMAIL API:');
            console.log('======================');
            
            // Probar Gmail API
            oauth2Client.setCredentials(tokens);
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            
            // Test simple
            const testResult = await gmail.users.getProfile({ userId: 'me' });
            console.log('✅ Gmail API funcionando correctamente');
            console.log(`📧 Email: ${testResult.data.emailAddress}`);
            console.log('');
            
            console.log('🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
            console.log('==========================================');
            console.log('✅ Refresh token obtenido y guardado');
            console.log('✅ Gmail API funcionando');
            console.log('✅ Sistema listo para producción');
            console.log('');
            
            console.log('🚀 PRÓXIMOS PASOS:');
            console.log('==================');
            console.log('1. Hacer deploy en producción');
            console.log('2. Verificar variables de entorno en servidor');
            console.log('3. Probar envío desde producción');
            console.log('4. Monitorear logs del servidor');
            
            return true;
            
        } else {
            console.log('❌ ERROR: No se obtuvo refresh token');
            console.log('💡 SOLUCIÓN: Asegúrate de usar prompt=consent en la URL de autorización');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error procesando código:', error.message);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('invalid_grant')) {
            console.log('🔍 CAUSA: Código de autorización inválido o expirado');
            console.log('💡 SOLUCIÓN: Generar nuevo código de autorización');
            console.log('💡 COMANDO: node scripts/configurar-gmail-playground.js');
        } else if (error.message.includes('redirect_uri_mismatch')) {
            console.log('🔍 CAUSA: Redirect URI no coincide');
            console.log('💡 SOLUCIÓN: Verificar configuración en Google Cloud Console');
            console.log('💡 REDIRECT URI: https://developers.google.com/oauthplayground');
        } else {
            console.log('🔍 CAUSA: Error desconocido');
            console.log('💡 SOLUCIÓN: Revisar logs detallados');
        }
        
        return false;
    }
}

// Obtener código de argumentos de línea de comandos
const codigo = process.argv[2];

// Ejecutar si se llama directamente
if (require.main === module) {
    procesarCodigoAutorizacion(codigo);
}

module.exports = { procesarCodigoAutorizacion };
