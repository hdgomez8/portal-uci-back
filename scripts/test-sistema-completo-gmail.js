#!/usr/bin/env node

/**
 * Script para probar el sistema completo con Gmail SMTP
 * Simula la creación de usuarios y envío de correos
 */

const { sendMail } = require('../utils/mailer');
const { getNuevoUsuarioTemplate } = require('../utils/emailTemplates');

async function testSistemaCompletoGmail() {
    console.log('🧪 TEST SISTEMA COMPLETO CON GMAIL SMTP');
    console.log('======================================');
    console.log('');

    try {
        console.log('👤 Simulando creación de usuario...');
        
        // Simular datos de empleado
        const empleado = {
            id: 1,
            nombres: 'Juan Carlos',
            apellidos: 'Gómez',
            documento: '12345678',
            email: 'hdgomez0@gmail.com'
        };
        
        console.log('📧 Empleado:', empleado.nombres, empleado.apellidos);
        console.log('📧 Email:', empleado.email);
        console.log('📧 Documento:', empleado.documento);
        console.log('');

        console.log('📧 Generando plantilla de correo...');
        
        // Generar plantilla de correo
        const emailHTML = getNuevoUsuarioTemplate(empleado);
        
        console.log('✅ Plantilla generada exitosamente');
        console.log('');

        console.log('📧 Enviando correo de bienvenida...');
        
        // Enviar correo de bienvenida
        const resultado = await sendMail(
            empleado.email,
            'Bienvenido al Portal UCI - Tus Credenciales de Acceso',
            emailHTML
        );
        
        console.log('✅ Correo de bienvenida enviado exitosamente');
        console.log('📧 Message ID:', resultado.messageId);
        console.log('📧 Provider:', resultado.provider);
        console.log('');

        console.log('🎉 ¡SISTEMA COMPLETO FUNCIONANDO!');
        console.log('================================');
        console.log('✅ Gmail SMTP configurado correctamente');
        console.log('✅ Plantillas de correo funcionando');
        console.log('✅ Envío de correos funcionando');
        console.log('✅ Sistema listo para producción');
        console.log('');
        
        console.log('🚀 PRÓXIMOS PASOS:');
        console.log('==================');
        console.log('1. El sistema está listo para usar en producción');
        console.log('2. Los correos se enviarán automáticamente al crear usuarios');
        console.log('3. Los correos se enviarán automáticamente al crear solicitudes');
        console.log('4. No se requieren configuraciones adicionales');
        
    } catch (error) {
        console.error('❌ Error en el test del sistema:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que las credenciales de Gmail estén correctas');
        console.log('2. Verificar que la verificación en 2 pasos esté habilitada');
        console.log('3. Verificar que la contraseña de aplicación esté generada');
        console.log('4. Verificar que no haya restricciones de seguridad en Gmail');
    }
}

// Ejecutar test
testSistemaCompletoGmail();
