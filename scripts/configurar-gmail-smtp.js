#!/usr/bin/env node

/**
 * Script para configurar Gmail SMTP (más simple que Gmail API)
 * No requiere OAuth, solo credenciales de aplicación
 */

const nodemailer = require('nodemailer');

async function configurarGmailSMTP() {
    console.log('🔧 CONFIGURANDO GMAIL SMTP (MÉTODO SIMPLE)');
    console.log('==========================================');
    console.log('');

    console.log('📋 INFORMACIÓN DEL SERVIDOR:');
    console.log('============================');
    console.log(`Servidor: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Directorio: ${process.cwd()}`);
    console.log('');

    console.log('🔑 CREDENCIALES DE GMAIL:');
    console.log('=========================');
    console.log('Email: hdgomez0@gmail.com');
    console.log('Contraseña de aplicación: wlstvjdckvhzxwvo');
    console.log('');

    console.log('📋 CONFIGURACIÓN EN .env:');
    console.log('==========================');
    console.log('GMAIL_USER=hdgomez0@gmail.com');
    console.log('GMAIL_PASS=wlstvjdckvhzxwvo');
    console.log('');

    console.log('🧪 PROBANDO CONEXIÓN GMAIL SMTP...');
    console.log('==================================');

    try {
        // Crear transporter Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verificar conexión
        await transporter.verify();
        console.log('✅ Conexión Gmail SMTP verificada exitosamente');
        console.log('');

        console.log('📧 ENVIANDO CORREO DE PRUEBA...');
        console.log('===============================');

        const mailOptions = {
            from: 'Portal UCI <hdgomez0@gmail.com>',
            to: 'hdgomez0@gmail.com',
            subject: '🧪 Test Gmail SMTP - Portal UCI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🧪 Test Gmail SMTP - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Directorio:</strong> ${process.cwd()}</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Gmail SMTP funcionando correctamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos con Gmail SMTP está funcionando correctamente.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente con Gmail SMTP');
        console.log('📧 Message ID:', info.messageId);
        console.log('📧 Destinatario: hdgomez0@gmail.com');
        console.log('');

        console.log('🎉 ¡CONFIGURACIÓN COMPLETADA!');
        console.log('============================');
        console.log('Gmail SMTP está funcionando correctamente.');
        console.log('Puedes usar este método en tu aplicación.');
        console.log('');

        console.log('🚀 PRÓXIMO PASO:');
        console.log('================');
        console.log('1. Actualiza tu archivo .env con las variables de arriba');
        console.log('2. Ejecuta: node scripts/test-gmail-smtp.js');

    } catch (error) {
        console.error('❌ Error con Gmail SMTP:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que la contraseña de aplicación sea correcta');
        console.log('2. Verificar que la verificación en 2 pasos esté habilitada');
        console.log('3. Verificar que la contraseña de aplicación esté generada');
        console.log('4. Verificar que no haya restricciones de seguridad en Gmail');
    }
}

// Ejecutar script
configurarGmailSMTP();
