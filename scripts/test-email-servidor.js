#!/usr/bin/env node

/**
 * Test Simple de Email en Servidor
 * Prueba básica de envío de correos
 */

const { sendMail } = require('../utils/mailer');

async function testEmailServidor() {
    console.log('🧪 TEST SIMPLE DE EMAIL EN SERVIDOR');
    console.log('==================================');
    console.log('');

    try {
        // Información básica del servidor
        const os = require('os');
        console.log('📊 Información del servidor:');
        console.log('- OS:', os.platform(), os.release());
        console.log('- Node.js:', process.version);
        console.log('- Hostname:', os.hostname());
        console.log('- Memoria libre:', Math.round(os.freemem() / 1024 / 1024) + ' MB');
        console.log('');

        // HTML simple para el correo
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">🧪 Test de Email - Servidor Portal UCI</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Servidor:</strong> ${os.hostname()}</p>
                    <p><strong>Sistema:</strong> ${os.platform()} ${os.release()}</p>
                    <p><strong>Node.js:</strong> ${process.version}</p>
                    <p><strong>Memoria libre:</strong> ${Math.round(os.freemem() / 1024 / 1024)} MB</p>
                    <p><strong>Uptime:</strong> ${Math.round(os.uptime() / 3600)} horas</p>
                </div>
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                    <p style="margin: 0; color: #155724;"><strong>✅ Test exitoso:</strong> El servidor puede enviar correos correctamente.</p>
                </div>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    Este es un correo de prueba automático del Portal UCI.<br>
                    Si recibes este correo, significa que la configuración de correos está funcionando correctamente.
                </p>
            </div>
        `;

        console.log('📧 Enviando correo de prueba...');
        console.log('⏳ Por favor espera...');
        
        // Enviar correo
        const result = await sendMail(
            'hdgomez0@gmail.com', // Destinatario
            '🧪 Test de Email - Servidor Portal UCI',
            emailHTML
        );

        console.log('');
        console.log('✅ CORREO ENVIADO EXITOSAMENTE');
        console.log('=============================');
        console.log('📧 Message ID:', result.messageId);
        console.log('📧 Destinatario: hdgomez0@gmail.com');
        console.log('📧 Asunto: 🧪 Test de Email - Servidor Portal UCI');
        console.log('📧 Fecha:', new Date().toLocaleString());
        console.log('');
        console.log('🎉 TEST COMPLETADO EXITOSAMENTE');
        console.log('El servidor puede enviar correos correctamente.');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST DE EMAIL');
        console.log('============================');
        console.log('Error:', error.message);
        console.log('Código:', error.code || 'N/A');
        console.log('Comando:', error.command || 'N/A');
        console.log('Respuesta:', error.response || 'N/A');
        console.log('');
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('1. Problema de conectividad de red');
        console.log('2. Credenciales de Gmail incorrectas');
        console.log('3. Firewall bloqueando el puerto 587');
        console.log('4. Configuración de TLS incorrecta');
        console.log('5. Gmail bloqueando el acceso');
        console.log('');
        console.log('💡 SOLUCIONES RECOMENDADAS:');
        console.log('1. Verificar conectividad: ping smtp.gmail.com');
        console.log('2. Verificar credenciales en mailer.js');
        console.log('3. Verificar configuración de firewall');
        console.log('4. Probar con diferentes configuraciones TLS');
        console.log('5. Contactar al administrador del servidor');
    }
}

// Ejecutar test
testEmailServidor();
