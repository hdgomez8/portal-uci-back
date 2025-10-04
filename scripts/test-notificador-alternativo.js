#!/usr/bin/env node

/**
 * Test del Sistema de Notificaciones Alternativo - Portal UCI
 * Prueba múltiples métodos de envío de correos
 */

const { 
    enviarCorreo, 
    notificarNuevaSolicitud, 
    notificarNuevoUsuario, 
    probarTodosLosMetodos 
} = require('../utils/notificadorAlternativo');

async function testNotificadorAlternativo() {
    console.log('🧪 TEST DEL SISTEMA DE NOTIFICACIONES ALTERNATIVO');
    console.log('================================================');
    console.log('');

    try {
        // 1. Test de todos los métodos
        console.log('1️⃣ Probando todos los métodos de envío...');
        const resultadoGeneral = await probarTodosLosMetodos();
        console.log('✅ Test general completado');
        console.log('   Proveedor usado:', resultadoGeneral.proveedor);
        console.log('   Message ID:', resultadoGeneral.messageId);
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
        console.log('   Proveedor:', notificacionSolicitud.proveedor);
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
        console.log('   Proveedor:', notificacionUsuario.proveedor);
        console.log('   Message ID:', notificacionUsuario.messageId);
        console.log('');

        // 4. Test de correo simple
        console.log('4️⃣ Enviando correo simple...');
        const correoSimple = await enviarCorreo(
            'hdgomez0@gmail.com',
            '📧 Test Correo Simple - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">📧 Test Correo Simple</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Sistema Alternativo</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Método:</strong> Sistema con fallback automático</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test exitoso</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema alternativo está funcionando correctamente.</p>
                    </div>
                </div>
            `
        );
        console.log('✅ Correo simple enviado');
        console.log('   Proveedor:', correoSimple.proveedor);
        console.log('   Message ID:', correoSimple.messageId);
        console.log('');

        // 5. Resumen final
        console.log('📋 RESUMEN DEL TEST');
        console.log('==================');
        console.log('✅ Test general: OK');
        console.log('✅ Notificación de solicitud: OK');
        console.log('✅ Notificación de usuario: OK');
        console.log('✅ Correo simple: OK');
        console.log('');
        console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 MÉTODOS DISPONIBLES:');
        console.log('   - Gmail STARTTLS (puerto 587)');
        console.log('   - Gmail SSL (puerto 465)');
        console.log('   - Outlook (puerto 587)');
        console.log('   - Yahoo (puerto 587)');
        console.log('   - API Externa (SendGrid, etc.)');
        console.log('   - Logging (fallback final)');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST');
        console.log('==================');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        console.log('');
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('1. Problemas de conectividad de red');
        console.log('2. Credenciales incorrectas en todos los proveedores');
        console.log('3. Firewall bloqueando todos los puertos');
        console.log('4. Configuración de TLS incorrecta');
        console.log('5. Problemas con el servidor de producción');
        console.log('');
        console.log('💡 SOLUCIONES:');
        console.log('1. Verificar conectividad de red');
        console.log('2. Revisar credenciales de correo');
        console.log('3. Verificar configuración de firewall');
        console.log('4. Probar con diferentes proveedores');
        console.log('5. Usar el método de logging como fallback');
    }
}

// Ejecutar test
testNotificadorAlternativo();
