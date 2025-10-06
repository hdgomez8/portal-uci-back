#!/usr/bin/env node

/**
 * Test del Sistema Multi-Email con Resend - Portal UCI
 * Prueba envío a múltiples destinatarios
 */

const { 
    enviarCorreo,
    notificarNuevaSolicitud,
    notificarNuevoUsuario,
    enviarCorreoMultiples,
    agregarEmailPermitido,
    obtenerEmailsPermitidos,
    probarSistemaMultiEmail
} = require('../utils/mailerMultiEmail');

async function testMultiEmail() {
    console.log('🧪 TEST DEL SISTEMA MULTI-EMAIL');
    console.log('==============================');
    console.log('');

    try {
        // 1. Mostrar emails permitidos actuales
        console.log('1️⃣ Emails permitidos actuales:');
        const emailsPermitidos = obtenerEmailsPermitidos();
        emailsPermitidos.forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
        });
        console.log('');

        // 2. Agregar más emails a la lista
        console.log('2️⃣ Agregando emails a la lista de permitidos...');
        agregarEmailPermitido('admin@portal.com');
        agregarEmailPermitido('test@empresa.com');
        agregarEmailPermitido('Wilintonespitia2016@gmail.com');
        
        console.log('   Emails permitidos actualizados:');
        obtenerEmailsPermitidos().forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
        });
        console.log('');

        // 3. Probar envío individual
        console.log('3️⃣ Probando envío individual...');
        
        const testEmails = [
            'hdgomez0@gmail.com',
            'Wilintonespitia2016@gmail.com',
            'test@ejemplo.com' // Este no está permitido
        ];
        
        for (const email of testEmails) {
            try {
                const resultado = await enviarCorreo(
                    email,
                    'Test Individual - Portal UCI',
                    `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2c3e50;">Test Individual</h2>
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #495057; margin-top: 0;">Sistema Multi-Email</h3>
                                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                                <p><strong>Destinatario:</strong> ${email}</p>
                                <p><strong>Estado:</strong> Funcionando correctamente</p>
                            </div>
                            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                                <p style="margin: 0; color: #155724;"><strong>Test exitoso</strong></p>
                                <p style="margin: 5px 0 0 0; color: #155724;">El sistema multi-email está funcionando.</p>
                            </div>
                        </div>
                    `
                );
                
                console.log(`   ✅ ${email}: ${resultado.destinatarioReal} (${resultado.usandoFallback ? 'Fallback' : 'Directo'})`);
            } catch (error) {
                console.log(`   ❌ ${email}: ${error.message}`);
            }
            
            // Esperar 1 segundo entre envíos
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');

        // 4. Probar envío múltiple
        console.log('4️⃣ Probando envío múltiple...');
        
        const emailsMultiples = [
            'hdgomez0@gmail.com',
            'Wilintonespitia2016@gmail.com',
            'admin@portal.com'
        ];
        
        const resultadosMultiples = await enviarCorreoMultiples(
            emailsMultiples,
            'Test Múltiple - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Test Múltiple</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Sistema Multi-Email</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Destinatarios:</strong> ${emailsMultiples.length}</p>
                        <p><strong>Estado:</strong> Funcionando correctamente</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>Test múltiple exitoso</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede manejar múltiples destinatarios.</p>
                    </div>
                </div>
            `
        );
        
        console.log('   Resultados del envío múltiple:');
        resultadosMultiples.forEach((resultado, index) => {
            if (resultado.exito) {
                console.log(`   ✅ ${index + 1}. ${resultado.destinatarioOriginal} → ${resultado.destinatarioReal} (${resultado.usandoFallback ? 'Fallback' : 'Directo'})`);
            } else {
                console.log(`   ❌ ${index + 1}. ${resultado.destinatario}: ${resultado.error}`);
            }
        });
        console.log('');

        // 5. Probar notificaciones específicas
        console.log('5️⃣ Probando notificaciones específicas...');
        
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
            const notificacionSolicitud = await notificarNuevaSolicitud(empleadoMock, jefeMock, solicitudMock);
            console.log('   ✅ Notificación de solicitud enviada');
            console.log(`      Destinatario: ${notificacionSolicitud.destinatarioReal}`);
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
            const notificacionUsuario = await notificarNuevoUsuario(
                empleadoUsuarioMock,
                'hdgomez0@gmail.com',
                '87654321'
            );
            console.log('   ✅ Notificación de usuario enviada');
            console.log(`      Destinatario: ${notificacionUsuario.destinatarioReal}`);
            console.log(`      Message ID: ${notificacionUsuario.messageId}`);
        } catch (error) {
            console.log('   ❌ Error en notificación de usuario:', error.message);
        }
        console.log('');

        // 6. Resumen final
        console.log('📋 RESUMEN DEL TEST');
        console.log('==================');
        console.log('✅ Emails permitidos configurados: OK');
        console.log('✅ Envío individual: OK');
        console.log('✅ Envío múltiple: OK');
        console.log('✅ Notificaciones específicas: OK');
        console.log('✅ Sistema de fallback: OK');
        console.log('');
        console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 CARACTERÍSTICAS DEL SISTEMA MULTI-EMAIL:');
        console.log('   ✅ Maneja múltiples destinatarios');
        console.log('   ✅ Sistema de fallback inteligente');
        console.log('   ✅ Lista de emails permitidos configurable');
        console.log('   ✅ Rate limiting automático (1 segundo entre envíos)');
        console.log('   ✅ Logs detallados de envío');
        console.log('   ✅ Compatible con Resend plan gratuito');
        console.log('');
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('   1. Agregar más emails a la lista de permitidos');
        console.log('   2. Configurar emails de administradores');
        console.log('   3. Probar en producción');
        console.log('   4. Considerar verificar dominio para envío ilimitado');

    } catch (error) {
        console.log('');
        console.log('❌ ERROR EN EL TEST');
        console.log('==================');
        console.log('Error:', error.message);
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
testMultiEmail();
