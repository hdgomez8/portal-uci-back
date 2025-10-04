#!/usr/bin/env node

/**
 * Diagnóstico de Inicio - Portal UCI
 * Versión simplificada para ejecutar al iniciar el servidor
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');
const net = require('net');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

async function diagnosticoInicio() {
    console.log('🔍 DIAGNÓSTICO DE INICIO - CORREOS');
    console.log('==================================');
    
    try {
        // 1. Información básica del sistema
        console.log('📊 Sistema:', os.platform(), os.release(), '| Node.js:', process.version);
        
        // 2. Verificar configuración del mailer
        const mailerPath = path.join(__dirname, '../utils/mailer.js');
        if (!fs.existsSync(mailerPath)) {
            console.log('❌ mailer.js no encontrado');
            return false;
        }
        
        // Usar configuración directa del correo
        const emailUser = 'hdgomez0@gmail.com';
        const emailPass = 'wlstvjdckvhzxwvo';
        
        console.log('✅ Configuración de correos encontrada');
        console.log('📧 Usuario:', emailUser);
        console.log('📧 Contraseña:', '***CONFIGURADA***');
        
        // 3. Verificar conectividad básica
        try {
            const dnsResult = await dnsLookup('smtp.gmail.com');
            console.log('✅ DNS resuelto:', dnsResult.address);
        } catch (dnsError) {
            console.log('❌ Error DNS:', dnsError.message);
            return false;
        }
        
        // 4. Verificar puerto 587
        try {
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    console.log('✅ Puerto 587 accesible');
                    socket.destroy();
                    resolve();
                });
                
                socket.on('timeout', () => {
                    console.log('❌ Timeout puerto 587');
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                
                socket.on('error', (error) => {
                    console.log('❌ Error puerto 587:', error.message);
                    socket.destroy();
                    reject(error);
                });
                
                socket.connect(587, 'smtp.gmail.com');
            });
        } catch (error) {
            return false;
        }
        
        // 5. Verificar conexión SMTP
        const config = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256'
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        };
        
        console.log('🔧 Configuración SMTP:');
        console.log('  Host:', config.host);
        console.log('  Puerto:', config.port);
        console.log('  Usuario:', config.auth.user);
        console.log('  Contraseña:', '***CONFIGURADA***');
        
        const transporter = nodemailer.createTransport(config);
        
        try {
            console.log('⏳ Verificando conexión SMTP...');
            await transporter.verify();
            console.log('✅ Conexión SMTP verificada');
        } catch (verifyError) {
            console.log('❌ Error SMTP:', verifyError.code, verifyError.message);
            return false;
        }
        
        // 6. Enviar correo de prueba (opcional, solo si está habilitado)
        const enviarCorreoPrueba = process.env.ENVIAR_CORREO_INICIO === 'true';
        
        if (enviarCorreoPrueba) {
            try {
                const emailHTML = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2c3e50;">🚀 Servidor Portal UCI Iniciado</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>Servidor:</strong> ${os.hostname()}</p>
                            <p><strong>Sistema:</strong> ${os.platform()} ${os.release()}</p>
                            <p><strong>Node.js:</strong> ${process.version}</p>
                            <p><strong>Memoria:</strong> ${Math.round(os.freemem() / 1024 / 1024)} MB libre</p>
                            <p><strong>Uptime:</strong> ${Math.round(os.uptime() / 3600)} horas</p>
                        </div>
                        <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                            <p style="margin: 0; color: #155724;"><strong>✅ Servidor iniciado correctamente</strong></p>
                            <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos está funcionando correctamente.</p>
                        </div>
                    </div>
                `;
                
                console.log('⏳ Enviando correo de inicio...');
                await transporter.sendMail({
                    from: `Portal UCI <${emailUser}>`,
                    to: emailUser,
                    subject: '🚀 Servidor Portal UCI Iniciado',
                    html: emailHTML
                });
                console.log('✅ Correo de inicio enviado a:', emailUser);
            } catch (emailError) {
                console.log('⚠️ Error enviando correo de inicio:', emailError.message);
            }
        }
        
        console.log('✅ Diagnóstico completado exitosamente');
        return true;
        
    } catch (error) {
        console.log('❌ Error en diagnóstico:', error.message);
        return false;
    }
}

module.exports = { diagnosticoInicio };
