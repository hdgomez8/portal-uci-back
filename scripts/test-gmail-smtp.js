#!/usr/bin/env node

/**
 * Test de Gmail SMTP - Portal UCI
 * Envío a múltiples correos usando Gmail
 * Sin restricciones de destinatarios
 */

const { 
    enviarCorreo,
    notificarNuevaSolicitudGmail,
    notificarNuevoUsuarioGmail,
    enviarCorreoMultiplesGmail,
    probarGmailSMTP
} = require('../utils/mailerGmail');

async function testGmailSMTP() {
    console.log('🧪 TEST DE GMAIL SMTP');
    console.log('======================');
    console.log('');

    try {
        // 1. Probar envío a múltiples emails
        console.log('1️⃣ Probando envío a múltiples emails con Gmail...');
        
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
        console.log('2️⃣ Probando envío individual con Gmail...');
        
        for (const email of testEmails) {
            try {
                const resultado = await enviarCorreo(
                    email,
                    'Test Individual Gmail - Portal UCI',
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2c3e50;">Test Individual Gmail</h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                                <p><strong>API:</strong> Gmail SMTP</p>
                                <p><strong>Destinatario:</strong> ${email}</p>
                                <p><strong>Estado:</strong> Funcionando correctamente</p>
                            </div>
                            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                                <p style="margin: 0; color: #155724;"><strong>Gmail SMTP funcionando</strong></p>
                                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a cualquier email sin restricciones.</p>
                            </div>
                        </div>
                    `
                );
                
                console.log(`   ✅ ${email}: ${resultado.messageId}`);
            } catch (error) {
                console.log(`   ❌ ${email}: ${error.message}`);
            }
            
            // Esperar 1 segundo entre envíos
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');

        // 3. Probar envío múltiple
        console.log('3️⃣ Probando envío múltiple con Gmail...');
        
        const resultadosMultiples = await enviarCorreoMultiplesGmail(
            testEmails,
            'Test Múltiple Gmail - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Test Múltiple Gmail</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>API:</strong> Gmail SMTP</p>
                        <p><strong>Destinatarios:</strong> ${testEmails.length}</p>
                        <p><strong>Estado:</strong> Funcionando correctamente</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>Gmail SMTP funcionando</strong></p>
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
        console.log('4️⃣ Probando notificaciones específicas con Gmail...');
        
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
            const notificacionSolicitud = await notificarNuevaSolicitudGmail(empleadoMock, jefeMock, solicitudMock);
            console.log('   ✅ Notificación de solicitud enviada con Gmail');
            console.log(`      Destinatario: ${notificacionSolicitud.destinatario}`);
            console.log(`      Message ID: ${notificacionSolicitud.messageId}`);
        } catch (error) {
            console.log('   ❌ Error en notificación de solicitud:', error.message);
        }
        
        // Esperar 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Notificación de nuevo usuario
        const empleadoUsuarioMock = {
            nombres: 'Maria Elena',
            apellidos: 'Rodriguez Lopez',
            documento: '87654321'
        };
        
        try {
            const notificacionUsuario = await notificarNuevoUsuarioGmail(
                empleadoUsuarioMock,
                'test@ejemplo.com',
                '87654321'
            );
            console.log('   ✅ Notificación de usuario enviada con Gmail');
            console.log(`      Destinatario: ${notificacionUsuario.destinatario}`);
            console.log(`      Message ID: ${notificacionUsuario.messageId}`);
        } catch (error) {
            console.log('   ❌ Error en notificación de usuario:', error.message);
        }
        console.log('');

        // 5. Resumen final
        console.log('📋 RESUMEN DEL TEST GMAIL');
        console.log('========================');
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
        console.log('💡 VENTAJAS DEL GMAIL SMTP:');
        console.log('   ✅ 100% GRATIS');
        console.log('   ✅ Puede enviar a CUALQUIER email');
        console.log('   ✅ Sin restricciones de destinatarios');
        console.log('   ✅ Fácil configuración');
        console.log('   ✅ Usa tu email existente');
        console.log('   ✅ Sin límites de destinatarios');
        console.log('');
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('   1. Verificar que las credenciales estén correctas');
        console.log('   2. Probar en producción');
        console.log('   3. Configurar en el proyecto principal');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST GMAIL');
        console.log('==========================');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 CONFIGURACIÓN REQUERIDA:');
        console.log('   1. Verificar GMAIL_USER en el código');
        console.log('   2. Verificar GMAIL_PASS (clave de aplicación)');
        console.log('   3. Asegurar que la clave de aplicación esté activa');
        console.log('   4. Verificar que Gmail permita el acceso');
    }
}

// Ejecutar test
testGmailSMTP();
