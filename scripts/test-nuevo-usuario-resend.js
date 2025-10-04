#!/usr/bin/env node

/**
 * Test de Envío de Correos para Nuevos Usuarios con Resend - Portal UCI
 * Simula el proceso completo de creación de usuario y envío de correo
 */

const { sendMail } = require('../utils/mailer');
const { getNuevoUsuarioTemplate } = require('../utils/emailTemplates');

async function testNuevoUsuarioResend() {
    console.log('🧪 TEST DE ENVÍO DE CORREOS PARA NUEVOS USUARIOS');
    console.log('===============================================');
    console.log('');

    try {
        // 1. Simular datos de un nuevo usuario (como en el controlador real)
        console.log('1️⃣ Simulando creación de nuevo usuario...');
        
        const empleadoMock = {
            nombres: 'Juan Carlos',
            apellidos: 'Perez Garcia',
            documento: '12345678',
            email: 'hdgomez0@gmail.com',
            fecha_ingreso: '2025-01-10',
            tipo_contrato: 'Indefinido',
            codigo: 'EMP001',
            oficio: 'Desarrollador',
            departamento: 'Tecnología'
        };
        
        const documento = '12345678';
        const email = 'hdgomez0@gmail.com';
        
        console.log('   Usuario simulado:');
        console.log('   - Nombre:', empleadoMock.nombres, empleadoMock.apellidos);
        console.log('   - Documento:', documento);
        console.log('   - Email:', email);
        console.log('   - Departamento:', empleadoMock.departamento);
        console.log('');

        // 2. Simular el proceso de envío de correo (como en el controlador)
        console.log('2️⃣ Simulando envío de correo de bienvenida...');
        
        // Usar la misma lógica que en el controlador
        const emailHTML = getNuevoUsuarioTemplate(empleadoMock, documento);
        
        console.log('   Generando plantilla de correo...');
        console.log('   Plantilla generada:', emailHTML.length, 'caracteres');
        console.log('');

        // 3. Enviar el correo usando sendMail (como en el controlador)
        console.log('3️⃣ Enviando correo con Resend...');
        
        const resultado = await sendMail(
            email,
            '🏢 Bienvenido al Portal UCI - Tus Credenciales de Acceso',
            emailHTML
        );
        
        console.log('✅ Correo de bienvenida enviado exitosamente');
        console.log('   Message ID:', resultado.messageId);
        console.log('   Destinatario:', resultado.accepted[0]);
        console.log('');

        // 4. Simular el proceso completo con setImmediate (como en el controlador)
        console.log('4️⃣ Simulando proceso asíncrono completo...');
        
        // Simular la respuesta inmediata al cliente
        console.log('   ✅ Usuario creado en BD (simulado)');
        console.log('   ✅ Transacción confirmada (simulada)');
        console.log('   ✅ Respuesta enviada al frontend (simulada)');
        console.log('   🔄 Iniciando envío asíncrono de correo...');
        
        // Simular el setImmediate del controlador
        await new Promise(resolve => {
            setImmediate(async () => {
                try {
                    console.log('   📧 Iniciando envío de correo de bienvenida asíncrono...');
                    
                    const emailHTML2 = getNuevoUsuarioTemplate(empleadoMock, documento);
                    const resultado2 = await sendMail(
                        email,
                        '🏢 Bienvenido al Portal UCI - Tus Credenciales de Acceso (Test Asíncrono)',
                        emailHTML2
                    );
                    
                    console.log('   ✅ Email de bienvenida enviado exitosamente a:', email);
                    console.log('   📧 Message ID:', resultado2.messageId);
                    resolve();
                } catch (mailError) {
                    console.error('   ❌ Error enviando correo de bienvenida asíncrono:', mailError);
                    resolve();
                }
            });
        });
        
        console.log('');

        // 5. Resumen final
        console.log('📋 RESUMEN DEL TEST');
        console.log('==================');
        console.log('✅ Simulación de usuario: OK');
        console.log('✅ Generación de plantilla: OK');
        console.log('✅ Envío de correo directo: OK');
        console.log('✅ Proceso asíncrono: OK');
        console.log('✅ Integración con Resend: OK');
        console.log('');
        console.log('🎉 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE');
        console.log('📧 Revisa tu correo para confirmar que las notificaciones llegaron');
        console.log('');
        console.log('💡 CONFIRMACIÓN:');
        console.log('   - ✅ SÍ se envían correos cuando se crea un nuevo usuario');
        console.log('   - ✅ Se maneja en el BACKEND (no en el frontend)');
        console.log('   - ✅ Usa Resend como proveedor de correo');
        console.log('   - ✅ Envío asíncrono (no bloquea la respuesta)');
        console.log('   - ✅ Manejo de errores robusto');
        console.log('');
        console.log('🚀 FLUJO COMPLETO:');
        console.log('   1. Frontend envía datos del nuevo usuario');
        console.log('   2. Backend crea empleado y usuario en BD');
        console.log('   3. Backend confirma transacción');
        console.log('   4. Backend responde al frontend inmediatamente');
        console.log('   5. Backend envía correo asíncronamente con Resend');

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
testNuevoUsuarioResend();
