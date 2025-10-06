#!/usr/bin/env node

/**
 * Script para probar Gmail API directamente
 */

const { sendMail } = require('../utils/mailer');

async function testGmailAPIDirecto() {
    console.log('🧪 TEST GMAIL API DIRECTO');
    console.log('=========================');
    console.log('');

    try {
        console.log('📧 Enviando correo de prueba con Gmail API...');
        console.log('📧 Destinatario: hdgomez0@gmail.com');
        console.log('📧 Asunto: 🧪 Test Gmail API - Local');
        console.log('');

        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Gmail API - Local',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Gmail API - Local</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API (HTTPS)</p>
                        <p><strong>Entorno:</strong> Local</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test Gmail API exitoso</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Gmail API está funcionando correctamente desde local.</p>
                    </div>
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin-top: 15px;">
                        <p style="margin: 0; color: #004085;"><strong>🚀 Listo para Producción</strong></p>
                        <p style="margin: 5px 0 0 0; color: #004085;">El sistema está listo para deploy en producción.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Correo enviado exitosamente con Gmail API');
        console.log('📧 Message ID:', resultado.messageId);
        console.log('📧 Provider:', resultado.provider);
        console.log('📧 Accepted:', resultado.accepted);
        console.log('');
        
        console.log('🎉 ¡TEST GMAIL API EXITOSO!');
        console.log('==========================');
        console.log('✅ Gmail API funcionando correctamente');
        console.log('✅ Refresh token válido');
        console.log('✅ Envío por HTTPS (puerto 443)');
        console.log('✅ No bloqueado por servidores');
        console.log('✅ Listo para producción');
        console.log('');
        
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('==================');
        console.log('1. Hacer deploy en producción');
        console.log('2. Verificar variables de entorno en servidor');
        console.log('3. Probar envío desde producción');
        console.log('4. Monitorear logs del servidor');
        
    } catch (error) {
        console.error('❌ Error en el test Gmail API:', error.message);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('invalid_grant')) {
            console.log('🔍 CAUSA: Refresh token expirado o inválido');
            console.log('💡 SOLUCIÓN: Generar nuevo refresh token');
            console.log('💡 COMANDO: node scripts/configurar-gmail-playground.js');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 CAUSA: Error de autenticación');
            console.log('💡 SOLUCIÓN: Verificar variables de entorno');
            console.log('💡 COMANDO: Verificar archivo .env');
        } else if (error.message.includes('network')) {
            console.log('🔍 CAUSA: Problema de red');
            console.log('💡 SOLUCIÓN: Verificar conectividad a internet');
            console.log('💡 ALTERNATIVA: Usar Gmail SMTP como fallback');
        } else {
            console.log('🔍 CAUSA: Error desconocido');
            console.log('💡 SOLUCIÓN: Revisar logs detallados');
            console.log('💡 ALTERNATIVA: Usar Gmail SMTP como fallback');
        }
        
        console.log('');
        console.log('🚀 SOLUCIONES RECOMENDADAS:');
        console.log('==========================');
        console.log('1. Verificar variables de entorno');
        console.log('2. Generar nuevo refresh token si es necesario');
        console.log('3. Verificar conectividad de red');
        console.log('4. Usar Gmail SMTP como fallback');
    }
}

// Ejecutar test
testGmailAPIDirecto();
