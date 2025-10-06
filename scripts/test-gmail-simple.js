#!/usr/bin/env node

/**
 * Script para probar Gmail Simple (sin OAuth)
 */

const { sendMail } = require('../utils/mailerGmailSimple');

async function testGmailSimple() {
    console.log('🧪 TEST GMAIL SIMPLE (SIN OAUTH)');
    console.log('=================================');
    console.log('');

    try {
        console.log('📧 Enviando correo de prueba...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Gmail Simple - Sin OAuth',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Gmail Simple - Sin OAuth</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail Simple (Sin OAuth)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Gmail Simple está funcionando correctamente sin OAuth.</p>
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
        console.log('Gmail Simple está funcionando correctamente sin OAuth.');
        console.log('Este método no requiere configuración de OAuth.');
        console.log('Puedes usar este método en tu aplicación.');
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que las credenciales de Gmail estén correctas');
        console.log('2. Verificar que la verificación en 2 pasos esté habilitada');
        console.log('3. Verificar que la contraseña de aplicación esté generada');
        console.log('4. Verificar que no haya restricciones de seguridad en Gmail');
        console.log('5. Verificar que el servidor no esté bloqueando SMTP');
    }
}

// Ejecutar test
testGmailSimple();
