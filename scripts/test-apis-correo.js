#!/usr/bin/env node

/**
 * Test de APIs de Correo - Portal UCI
 * Prueba SendGrid, Mailgun, Resend y Amazon SES
 */

const { 
    enviarCorreoSendGrid,
    enviarCorreoMailgun,
    enviarCorreoResend,
    enviarCorreoSES,
    enviarCorreoConAPIs,
    probarTodasLasAPIs
} = require('../utils/notificadorAPIs');

async function testAPIsCorreo() {
    console.log('🧪 TEST DE APIs DE CORREO');
    console.log('========================');
    console.log('');

    const testEmail = 'hdgomez0@gmail.com';
    const testAsunto = '🧪 Test APIs de Correo - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🧪 Test de APIs de Correo</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Método:</strong> APIs externas</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>✅ Test exitoso</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema de APIs está funcionando correctamente.</p>
            </div>
        </div>
    `;

    try {
        // 1. Test con fallback automático
        console.log('1️⃣ Probando fallback automático entre APIs...');
        const resultadoGeneral = await enviarCorreoConAPIs(testEmail, testAsunto, testContenido);
        console.log('✅ Test general completado');
        console.log('   API usada:', resultadoGeneral.proveedor);
        console.log('   Message ID:', resultadoGeneral.messageId);
        console.log('');

        // 2. Test individual de SendGrid
        console.log('2️⃣ Probando SendGrid...');
        try {
            const resultadoSendGrid = await enviarCorreoSendGrid(testEmail, '📧 Test SendGrid', testContenido);
            console.log('✅ SendGrid funcionando');
            console.log('   Message ID:', resultadoSendGrid.messageId);
        } catch (error) {
            console.log('❌ SendGrid falló:', error.message);
        }
        console.log('');

        // 3. Test individual de Resend
        console.log('3️⃣ Probando Resend...');
        try {
            const resultadoResend = await enviarCorreoResend(testEmail, '📧 Test Resend', testContenido);
            console.log('✅ Resend funcionando');
            console.log('   Message ID:', resultadoResend.messageId);
        } catch (error) {
            console.log('❌ Resend falló:', error.message);
        }
        console.log('');

        // 4. Test individual de Mailgun
        console.log('4️⃣ Probando Mailgun...');
        try {
            const resultadoMailgun = await enviarCorreoMailgun(testEmail, '📧 Test Mailgun', testContenido);
            console.log('✅ Mailgun funcionando');
            console.log('   Message ID:', resultadoMailgun.messageId);
        } catch (error) {
            console.log('❌ Mailgun falló:', error.message);
        }
        console.log('');

        // 5. Test individual de Amazon SES
        console.log('5️⃣ Probando Amazon SES...');
        try {
            const resultadoSES = await enviarCorreoSES(testEmail, '📧 Test Amazon SES', testContenido);
            console.log('✅ Amazon SES funcionando');
            console.log('   Message ID:', resultadoSES.messageId);
        } catch (error) {
            console.log('❌ Amazon SES falló:', error.message);
        }
        console.log('');

        // 6. Resumen final
        console.log('📋 RESUMEN DEL TEST');
        console.log('==================');
        console.log('✅ Fallback automático: OK');
        console.log('✅ APIs individuales: Probadas');
        console.log('');
        console.log('🎉 TEST COMPLETADO');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 CONFIGURACIÓN RECOMENDADA:');
        console.log('   1. SendGrid (principal) - 100 correos/día gratis');
        console.log('   2. Resend (secundario) - 3,000 correos/mes gratis');
        console.log('   3. Mailgun (terciario) - 5,000 correos/mes gratis');
        console.log('   4. Amazon SES (cuaternario) - $0.10 por 1,000 correos');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST');
        console.log('==================');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 CONFIGURACIÓN REQUERIDA:');
        console.log('   1. Crear cuentas en las APIs');
        console.log('   2. Obtener API keys');
        console.log('   3. Configurar variables de entorno');
        console.log('   4. Verificar credenciales');
    }
}

// Ejecutar test
testAPIsCorreo();
