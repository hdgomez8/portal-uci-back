#!/usr/bin/env node

/**
 * Script para probar el mailer.js actualizado con Gmail SMTP
 */

const { sendMail } = require('../utils/mailer');

async function testMailerGmailSMTP() {
    console.log('🧪 TEST MAILER.JS CON GMAIL SMTP');
    console.log('================================');
    console.log('');

    try {
        console.log('📧 Enviando correo de prueba...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Mailer.js - Gmail SMTP',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Mailer.js - Gmail SMTP</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail SMTP</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El mailer.js está funcionando correctamente con Gmail SMTP.</p>
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
        console.log('El mailer.js está funcionando correctamente con Gmail SMTP.');
        console.log('Puedes usar este método en tu aplicación.');
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que las credenciales de Gmail estén correctas');
        console.log('2. Verificar que la verificación en 2 pasos esté habilitada');
        console.log('3. Verificar que la contraseña de aplicación esté generada');
        console.log('4. Verificar que no haya restricciones de seguridad en Gmail');
    }
}

// Ejecutar test
testMailerGmailSMTP();
