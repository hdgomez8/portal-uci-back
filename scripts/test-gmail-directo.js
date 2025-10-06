#!/usr/bin/env node

/**
 * Script para probar Gmail API Directo (con credenciales de servicio)
 */

const { sendMail } = require('../utils/mailerGmailDirecto');

async function testGmailDirecto() {
    console.log('🧪 TEST GMAIL API DIRECTO (CON CREDENCIALES DE SERVICIO)');
    console.log('======================================================');
    console.log('');

    try {
        console.log('📧 Enviando correo de prueba...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🧪 Test Gmail API Directo - Con Credenciales de Servicio',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Gmail API Directo</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Test</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API Directo (Credenciales de Servicio)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Gmail API Directo está funcionando correctamente con credenciales de servicio.</p>
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
        console.log('Gmail API Directo está funcionando correctamente.');
        console.log('Este método usa credenciales de servicio y es más confiable.');
        console.log('Puedes usar este método en tu aplicación.');
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que el archivo de credenciales esté en la ubicación correcta');
        console.log('2. Verificar que las credenciales de servicio sean válidas');
        console.log('3. Verificar que Gmail API esté habilitado en Google Cloud Console');
        console.log('4. Verificar que el archivo JSON tenga el formato correcto');
        console.log('5. Verificar que no haya restricciones de red en el servidor');
    }
}

// Ejecutar test
testGmailDirecto();
