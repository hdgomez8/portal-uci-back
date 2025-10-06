#!/usr/bin/env node

/**
 * Script para probar Gmail API con refresh token
 */

const { sendMail } = require('../utils/mailerGmailAPI');

async function testGmailAPI() {
    console.log('🧪 TEST GMAIL API (CON REFRESH TOKEN)');
    console.log('====================================');
    console.log('');

    // Verificar variables de entorno
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
        console.log('❌ Error: GOOGLE_REFRESH_TOKEN no está configurado');
        console.log('');
        console.log('🔧 CONFIGURACIÓN NECESARIA:');
        console.log('1. Agrega GOOGLE_REFRESH_TOKEN a tu archivo .env');
        console.log('2. Obtén el refresh token ejecutando: node scripts/procesar-codigo-alternativo.js [CODIGO]');
        console.log('');
        return;
    }

    try {
        console.log('📧 Enviando correo de prueba...');
        console.log('📧 Refresh Token:', process.env.GOOGLE_REFRESH_TOKEN.substring(0, 20) + '...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Gmail API - Con Refresh Token',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Gmail API - Con Refresh Token</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API (Con Refresh Token)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Gmail API está funcionando correctamente con refresh token.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Correo enviado exitosamente');
        console.log('📧 Message ID:', resultado.messageId);
        console.log('📧 Provider:', resultado.provider);
        console.log('📧 Accepted:', resultado.accepted);
        console.log('');
        
        console.log('🎉 ¡TEST COMPLETADO EXITOSAMENTE!');
        console.log('================================');
        console.log('Gmail API está funcionando correctamente con refresh token.');
        console.log('Este método es más confiable para servidores.');
        console.log('Puedes usar este método en tu aplicación.');
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que GOOGLE_REFRESH_TOKEN esté configurado correctamente');
        console.log('2. Verificar que el refresh token sea válido');
        console.log('3. Verificar que Gmail API esté habilitado en Google Cloud Console');
        console.log('4. Verificar que las credenciales OAuth 2.0 sean correctas');
        console.log('5. Intentar obtener un nuevo refresh token');
    }
}

// Ejecutar test
testGmailAPI();
