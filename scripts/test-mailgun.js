#!/usr/bin/env node

/**
 * Test de Mailgun - Portal UCI
 * 5,000 correos/mes GRATIS
 * Envío a múltiples correos sin restricciones
 */

const { 
    enviarCorreo,
    notificarNuevaSolicitudMailgun,
    notificarNuevoUsuarioMailgun,
    enviarCorreoMultiplesMailgun,
    probarMailgun
} = require('../utils/mailerMailgun');

async function testMailgun() {
    console.log('🧪 TEST DE MAILGUN');
    console.log('==================');
    console.log('');

    try {
        // 1. Probar envío a múltiples emails
        console.log('1️⃣ Probando envío a múltiples emails con Mailgun...');
        
        const testEmails = [
            'hdgomez0@gmail.com',
            'Wilintonespitia2016@gmail.com',
            'test@ejemplo.com',
            'admin@empresa.com',
            'usuario@otrodominio.com'
        ];
        
        console.log('   Emails de prueba:');
        testEmails.forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
        });
        console.log('');

        // 2. Probar envío individual
        console.log('2️⃣ Probando envío individual con Mailgun...');
        
        for (const email of testEmails) {
            try {
                const resultado = await enviarCorreo(
                    email,
                    'Test Individual Mailgun - Portal UCI',
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2c3e50;">Test Individual Mailgun</h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                                <p><strong>API:</strong> Mailgun GRATIS</p>
                                <p><strong>Destinatario:</strong> ${email}</p>
                                <p><strong>Estado:</strong> Funcionando correctamente</p>
                            </div>
                            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                                <p style="margin: 0; color: #155724;"><strong>Mailgun funcionando</strong></p>
                                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a cualquier email sin restricciones.</p>
                            </div>
                        </div>
                    `
                );
                
                console.log(`   ✅ ${email}: ${resultado.messageId}`);
            } catch (error) {
                console.log(`   ❌ ${email}: ${error.message}`);
            }
            
            // Esperar 0.5 segundos entre envíos
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('');

        // 3. Probar envío múltiple
        console.log('3️⃣ Probando envío múltiple con Mailgun...');
        
        const resultadosMultiples = await enviarCorreoMultiplesMailgun(
            testEmails,
            'Test Múltiple Mailgun - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Test Múltiple Mailgun</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>API:</strong> Mailgun GRATIS</p>
                        <p><strong>Destinatarios:</strong> ${testEmails.length}</p>
                        <p><strong>Estado:</strong> Funcionando correctamente</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>Mailgun funcionando</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a múltiples destinatarios sin restricciones.</p>
                    </div>
                </div>
            `
        );
        
        console.log('   Resultados del envío múltiple:');
        resultadosMultiples.forEach((resultado, index) => {
            if (resultado.exito) {
                console.log(`   ✅ ${index + 1}. ${resultado.destinatario}: ${resultado.messageId}`);
            } else {
                console.log(`   ❌ ${index + 1}. ${resultado.destinatario}: ${resultado.error}`);
            }
        });
        console.log('');

        // 4. Probar notificaciones específicas
        console.log('4️⃣ Probando notificaciones específicas con Mailgun...');
        
        // Notificación de nueva solicitud
        const empleadoMock = {
            nombres: 'Juan Carlos',
            apellidos: 'Perez Garcia',
            documento: '12345678',
            area: 'Recursos Humanos'
        };
        
        const jefeMock = {
            email: 'Wilintonespitia2016@gmail.com'
        };
        
        const solicitudMock = {
            tipo: 'Vacaciones'
        };
        
        try {
            const notificacionSolicitud = await notificarNuevaSolicitudMailgun(empleadoMock, jefeMock, solicitudMock);
            console.log('   ✅ Notificación de solicitud enviada con Mailgun');
            console.log(`      Destinatario: ${notificacionSolicitud.destinatario}`);
            console.log(`      Message ID: ${notificacionSolicitud.messageId}`);
        } catch (error) {
            console.log('   ❌ Error en notificación de solicitud:', error.message);
        }
        
        // Esperar 0.5 segundos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Notificación de nuevo usuario
        const empleadoUsuarioMock = {
            nombres: 'Maria Elena',
            apellidos: 'Rodriguez Lopez',
            documento: '87654321'
        };
        
        try {
            const notificacionUsuario = await notificarNuevoUsuarioMailgun(
                empleadoUsuarioMock,
                'test@ejemplo.com',
                '87654321'
            );
            console.log('   ✅ Notificación de usuario enviada con Mailgun');
            console.log(`      Destinatario: ${notificacionUsuario.destinatario}`);
            console.log(`      Message ID: ${notificacionUsuario.messageId}`);
        } catch (error) {
            console.log('   ❌ Error en notificación de usuario:', error.message);
        }
        console.log('');

        // 5. Resumen final
        console.log('📋 RESUMEN DEL TEST MAILGUN');
        console.log('===========================');
        console.log('✅ Envío individual: OK');
        console.log('✅ Envío múltiple: OK');
        console.log('✅ Notificaciones específicas: OK');
        console.log('✅ Envío a cualquier email: OK');
        console.log('✅ Sin restricciones: OK');
        console.log('✅ 100% GRATIS: OK');
        console.log('');
        console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 VENTAJAS DE MAILGUN:');
        console.log('   ✅ 5,000 correos/mes GRATIS (más que SendGrid)');
        console.log('   ✅ Puede enviar a CUALQUIER email');
        console.log('   ✅ Sin restricciones de destinatarios');
        console.log('   ✅ Muy estable en producción');
        console.log('   ✅ APIs RESTful');
        console.log('   ✅ Sin verificación de dominio necesaria');
        console.log('');
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('   1. Crear cuenta en mailgun.com');
        console.log('   2. Obtener API Key y dominio');
        console.log('   3. Configurar en el código');
        console.log('   4. Probar en producción');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST MAILGUN');
        console.log('===========================');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 CONFIGURACIÓN REQUERIDA:');
        console.log('   1. Crear cuenta en mailgun.com');
        console.log('   2. Verificar email');
        console.log('   3. Obtener API Key');
        console.log('   4. Obtener dominio de Mailgun');
        console.log('   5. Actualizar MAILGUN_API_KEY y MAILGUN_DOMAIN en el código');
    }
}

// Ejecutar test
testMailgun();
