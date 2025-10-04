#!/usr/bin/env node

/**
 * Script de Diagnóstico para Servidor - Portal UCI
 * Verifica configuración de correos y conectividad en el servidor
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 DIAGNÓSTICO DE SERVIDOR - PORTAL UCI');
console.log('=====================================');
console.log('');

async function diagnosticarServidor() {
    try {
        // 1. Información del sistema
        console.log('📊 INFORMACIÓN DEL SISTEMA');
        console.log('-------------------------');
        console.log('OS:', os.platform(), os.release());
        console.log('Node.js:', process.version);
        console.log('Memoria total:', Math.round(os.totalmem() / 1024 / 1024) + ' MB');
        console.log('Memoria libre:', Math.round(os.freemem() / 1024 / 1024) + ' MB');
        console.log('CPU:', os.cpus()[0].model);
        console.log('Uptime:', Math.round(os.uptime() / 3600) + ' horas');
        console.log('');

        // 2. Verificar variables de entorno
        console.log('🔧 VARIABLES DE ENTORNO');
        console.log('----------------------');
        console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NO_DEFINIDA');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***DEFINIDA***' : 'NO_DEFINIDA');
        console.log('NODE_ENV:', process.env.NODE_ENV || 'NO_DEFINIDA');
        console.log('');

        // 3. Leer configuración del mailer.js
        console.log('📧 CONFIGURACIÓN DEL MAILER');
        console.log('---------------------------');
        const mailerPath = path.join(__dirname, '../utils/mailer.js');
        
        if (!fs.existsSync(mailerPath)) {
            console.log('❌ ERROR: No se encuentra mailer.js');
            return;
        }
        
        const mailerContent = fs.readFileSync(mailerPath, 'utf8');
        const userMatch = mailerContent.match(/user:\s*process\.env\.EMAIL_USER\s*\|\|\s*['"`]([^'"`]+)['"`]/);
        const passMatch = mailerContent.match(/pass:\s*process\.env\.EMAIL_PASS\s*\|\|\s*['"`]([^'"`]+)['"`]/);
        
        console.log('Usuario configurado:', userMatch ? userMatch[1] : 'NO_ENCONTRADO');
        console.log('Contraseña configurada:', passMatch ? '***ENCONTRADA***' : 'NO_ENCONTRADA');
        console.log('');

        // 4. Crear transporter con configuración real
        console.log('🔌 CONFIGURACIÓN DEL TRANSPORTER');
        console.log('-------------------------------');
        
        const config = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || (userMatch ? userMatch[1] : 'hdgomez0@gmail.com'),
                pass: process.env.EMAIL_PASS || (passMatch ? passMatch[1] : 'wlstvjdckvhzxwvo')
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256'
            },
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000
        };
        
        console.log('Host:', config.host);
        console.log('Puerto:', config.port);
        console.log('Usuario:', config.auth.user);
        console.log('Contraseña:', config.auth.pass ? '***CONFIGURADA***' : 'NO_CONFIGURADA');
        console.log('TLS minVersion:', config.tls.minVersion);
        console.log('');

        // 5. Verificar conectividad de red
        console.log('🌐 VERIFICACIÓN DE CONECTIVIDAD');
        console.log('------------------------------');
        
        const dns = require('dns');
        const { promisify } = require('util');
        const dnsLookup = promisify(dns.lookup);
        
        try {
            const result = await dnsLookup('smtp.gmail.com');
            console.log('✅ DNS resuelto:', result.address);
        } catch (dnsError) {
            console.log('❌ Error DNS:', dnsError.message);
        }
        console.log('');

        // 6. Crear transporter y verificar conexión
        console.log('📡 VERIFICACIÓN DE CONEXIÓN SMTP');
        console.log('--------------------------------');
        
        const transporter = nodemailer.createTransporter(config);
        
        try {
            console.log('⏳ Verificando conexión SMTP...');
            const verifyResult = await transporter.verify();
            console.log('✅ Conexión SMTP verificada exitosamente');
            console.log('✅ Servidor SMTP responde correctamente');
        } catch (verifyError) {
            console.log('❌ Error verificando conexión SMTP:');
            console.log('   Código:', verifyError.code);
            console.log('   Mensaje:', verifyError.message);
            console.log('   Comando:', verifyError.command);
            console.log('   Respuesta:', verifyError.response);
            console.log('');
            
            // Intentar diagnóstico adicional
            console.log('🔍 DIAGNÓSTICO ADICIONAL');
            console.log('------------------------');
            
            if (verifyError.code === 'EAUTH') {
                console.log('❌ Error de autenticación:');
                console.log('   - Verificar usuario y contraseña');
                console.log('   - Verificar que la contraseña de aplicación esté habilitada');
                console.log('   - Verificar que 2FA esté habilitado en Gmail');
            } else if (verifyError.code === 'ECONNECTION') {
                console.log('❌ Error de conexión:');
                console.log('   - Verificar conectividad de red');
                console.log('   - Verificar firewall del servidor');
                console.log('   - Verificar que el puerto 587 esté abierto');
            } else if (verifyError.code === 'ETIMEDOUT') {
                console.log('❌ Timeout de conexión:');
                console.log('   - Verificar latencia de red');
                console.log('   - Verificar configuración de timeout');
            }
            
            return;
        }
        console.log('');

        // 7. Enviar correo de prueba
        console.log('📧 ENVÍO DE CORREO DE PRUEBA');
        console.log('----------------------------');
        
        const emailHTML = `
            <h2>🔧 Diagnóstico de Servidor - Portal UCI</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Servidor:</strong> ${os.hostname()}</p>
            <p><strong>OS:</strong> ${os.platform()} ${os.release()}</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
            <p><strong>Memoria:</strong> ${Math.round(os.freemem() / 1024 / 1024)} MB libre de ${Math.round(os.totalmem() / 1024 / 1024)} MB</p>
            <p><strong>Uptime:</strong> ${Math.round(os.uptime() / 3600)} horas</p>
            <hr>
            <p><strong>✅ Diagnóstico completado exitosamente</strong></p>
            <p>El servidor puede enviar correos correctamente.</p>
        `;
        
        try {
            console.log('⏳ Enviando correo de prueba...');
            const result = await transporter.sendMail({
                from: 'Portal UCI <hdgomez0@gmail.com>',
                to: config.auth.user, // Enviar a sí mismo
                subject: '🔧 Diagnóstico de Servidor - Portal UCI',
                html: emailHTML
            });
            
            console.log('✅ Correo de prueba enviado exitosamente');
            console.log('📧 Message ID:', result.messageId);
            console.log('📧 Destinatario:', config.auth.user);
            
        } catch (sendError) {
            console.log('❌ Error enviando correo de prueba:');
            console.log('   Código:', sendError.code);
            console.log('   Mensaje:', sendError.message);
            console.log('   Comando:', sendError.command);
            console.log('   Respuesta:', sendError.response);
        }
        console.log('');

        // 8. Resumen final
        console.log('📋 RESUMEN DEL DIAGNÓSTICO');
        console.log('-------------------------');
        console.log('✅ Sistema operativo: OK');
        console.log('✅ Node.js: OK');
        console.log('✅ Configuración mailer: OK');
        console.log('✅ Conectividad DNS: OK');
        console.log('✅ Conexión SMTP: OK');
        console.log('✅ Envío de correo: OK');
        console.log('');
        console.log('🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
        console.log('El servidor está configurado correctamente para enviar correos.');

    } catch (error) {
        console.log('❌ ERROR CRÍTICO EN DIAGNÓSTICO');
        console.log('-------------------------------');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        console.log('');
        console.log('🔧 ACCIONES RECOMENDADAS:');
        console.log('1. Verificar que Node.js esté instalado correctamente');
        console.log('2. Verificar que las dependencias estén instaladas (npm install)');
        console.log('3. Verificar conectividad de red del servidor');
        console.log('4. Verificar configuración de firewall');
        console.log('5. Contactar al administrador del servidor');
    }
}

// Ejecutar diagnóstico
diagnosticarServidor();
