#!/usr/bin/env node

/**
 * Test del Sistema Completo con Resend - Portal UCI
 * Prueba todas las funcionalidades de notificaciones
 */

const { 
    enviarCorreo,
    notificarNuevaSolicitud,
    notificarNuevoUsuario,
    probarResend
} = require('../utils/notificadorResend');

async function testSistemaResend() {
    console.log('🧪 TEST DEL SISTEMA COMPLETO CON RESEND');
    console.log('======================================');
    console.log('');

    try {
        // 1. Test básico de Resend
        console.log('1️⃣ Probando Resend básico...');
        const resultadoBasico = await probarResend();
        console.log('✅ Test básico completado');
        console.log('   Message ID:', resultadoBasico.messageId);
        console.log('');

        // 2. Test de notificación de nueva solicitud
        console.log('2️⃣ Enviando notificación de nueva solicitud...');
        const empleadoMock = {
            nombres: 'Juan Carlos',
            apellidos: 'Pérez García',
            documento: '12345678',
            area: 'Recursos Humanos'
        };
        
        const jefeMock = {
            email: 'hdgomez0@gmail.com'
        };
        
        const solicitudMock = {
            tipo: 'Vacaciones'
        };
        
        const notificacionSolicitud = await notificarNuevaSolicitud(empleadoMock, jefeMock, solicitudMock);
        console.log('✅ Notificación de solicitud enviada');
        console.log('   Message ID:', notificacionSolicitud.messageId);
        console.log('');

        // 3. Test de notificación de nuevo usuario
        console.log('3️⃣ Enviando notificación de nuevo usuario...');
        const notificacionUsuario = await notificarNuevoUsuario(
            empleadoMock,
            'hdgomez0@gmail.com',
            '87654321'
        );
        console.log('✅ Notificación de usuario enviada');
        console.log('   Message ID:', notificacionUsuario.messageId);
        console.log('');

        // 4. Test de correo genérico
        console.log('4️⃣ Enviando correo genérico...');
        const correoGenerico = await enviarCorreo(
            'hdgomez0@gmail.com',
            '📧 Test Correo Genérico - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">📧 Test Correo Genérico</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Sistema Resend</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>API:</strong> Resend</p>
                        <p><strong>Estado:</strong> Funcionando perfectamente</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Sistema operativo</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Todas las funcionalidades están funcionando correctamente.</p>
                    </div>
                </div>
            `
        );
        console.log('✅ Correo genérico enviado');
        console.log('   Message ID:', correoGenerico.messageId);
        console.log('');

        // 5. Resumen final
        console.log('📋 RESUMEN DEL TEST');
        console.log('==================');
        console.log('✅ Test básico: OK');
        console.log('✅ Notificación de solicitud: OK');
        console.log('✅ Notificación de usuario: OK');
        console.log('✅ Correo genérico: OK');
        console.log('');
        console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 SISTEMA RESEND CONFIGURADO:');
        console.log('   - API Key: re_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D');
        console.log('   - From: Portal UCI <noreply@resend.dev>');
        console.log('   - Límite: 3,000 correos/mes gratis');
        console.log('   - Estado: Funcionando perfectamente');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST');
        console.log('==================');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        console.log('');
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('1. Problemas de conectividad de red');
        console.log('2. API Key inválida o expirada');
        console.log('3. Límite de correos excedido');
        console.log('4. Problemas con el servidor de Resend');
        console.log('');
        console.log('💡 SOLUCIONES:');
        console.log('1. Verificar conectividad de red');
        console.log('2. Verificar API Key en resend.com');
        console.log('3. Revisar cuotas de correos');
        console.log('4. Contactar soporte de Resend');
    }
}

// Ejecutar test
testSistemaResend();
