#!/usr/bin/env node

/**
 * Diagnóstico Completo de Correos - Servidor Portal UCI
 * Script único que ejecuta todas las verificaciones necesarias
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');
const net = require('net');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

console.log('🔍 DIAGNÓSTICO COMPLETO DE CORREOS - SERVIDOR');
console.log('=============================================');
console.log('');

async function diagnosticoCompleto() {
    const resultados = {
        sistema: {},
        configuracion: {},
        red: {},
        smtp: {},
        email: {}
    };

    try {
        // 1. INFORMACIÓN DEL SISTEMA
        console.log('1️⃣ INFORMACIÓN DEL SISTEMA');
        console.log('-------------------------');
        resultados.sistema = {
            plataforma: os.platform(),
            version: os.release(),
            nodejs: process.version,
            hostname: os.hostname(),
            memoriaTotal: Math.round(os.totalmem() / 1024 / 1024),
            memoriaLibre: Math.round(os.freemem() / 1024 / 1024),
            uptime: Math.round(os.uptime() / 3600),
            cpus: os.cpus().length
        };
        
        console.log('OS:', resultados.sistema.plataforma, resultados.sistema.version);
        console.log('Node.js:', resultados.sistema.nodejs);
        console.log('Hostname:', resultados.sistema.hostname);
        console.log('Memoria:', resultados.sistema.memoriaLibre + ' MB libre de ' + resultados.sistema.memoriaTotal + ' MB');
        console.log('Uptime:', resultados.sistema.uptime + ' horas');
        console.log('CPUs:', resultados.sistema.cpus);
        console.log('');

        // 2. CONFIGURACIÓN
        console.log('2️⃣ CONFIGURACIÓN');
        console.log('----------------');
        
        // Variables de entorno
        resultados.configuracion.env = {
            emailUser: process.env.EMAIL_USER || 'NO_DEFINIDA',
            emailPass: process.env.EMAIL_PASS ? '***DEFINIDA***' : 'NO_DEFINIDA',
            nodeEnv: process.env.NODE_ENV || 'NO_DEFINIDA'
        };
        
        console.log('EMAIL_USER:', resultados.configuracion.env.emailUser);
        console.log('EMAIL_PASS:', resultados.configuracion.env.emailPass);
        console.log('NODE_ENV:', resultados.configuracion.env.nodeEnv);
        
        // Archivo mailer.js
        const mailerPath = path.join(__dirname, '../utils/mailer.js');
        if (fs.existsSync(mailerPath)) {
            const mailerContent = fs.readFileSync(mailerPath, 'utf8');
            const userMatch = mailerContent.match(/user:\s*process\.env\.EMAIL_USER\s*\|\|\s*['"`]([^'"`]+)['"`]/);
            const passMatch = mailerContent.match(/pass:\s*process\.env\.EMAIL_PASS\s*\|\|\s*['"`]([^'"`]+)['"`]/);
            
            resultados.configuracion.mailer = {
                archivoExiste: true,
                usuario: userMatch ? userMatch[1] : 'NO_ENCONTRADO',
                contraseña: passMatch ? '***ENCONTRADA***' : 'NO_ENCONTRADA'
            };
            
            console.log('mailer.js: ✅ Encontrado');
            console.log('Usuario configurado:', resultados.configuracion.mailer.usuario);
            console.log('Contraseña configurada:', resultados.configuracion.mailer.contraseña);
        } else {
            resultados.configuracion.mailer = { archivoExiste: false };
            console.log('mailer.js: ❌ No encontrado');
        }
        console.log('');

        // 3. VERIFICACIÓN DE RED
        console.log('3️⃣ VERIFICACIÓN DE RED');
        console.log('---------------------');
        
        // DNS de Gmail
        try {
            const dnsResult = await dnsLookup('smtp.gmail.com');
            resultados.red.dns = {
                exitoso: true,
                ip: dnsResult.address,
                familia: dnsResult.family === 4 ? 'IPv4' : 'IPv6'
            };
            console.log('DNS smtp.gmail.com: ✅', dnsResult.address);
        } catch (dnsError) {
            resultados.red.dns = {
                exitoso: false,
                error: dnsError.message
            };
            console.log('DNS smtp.gmail.com: ❌', dnsError.message);
        }
        
        // Conectividad al puerto 587
        try {
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(10000);
                
                socket.on('connect', () => {
                    resultados.red.puerto587 = { exitoso: true };
                    console.log('Puerto 587: ✅ Conectado');
                    socket.destroy();
                    resolve();
                });
                
                socket.on('timeout', () => {
                    resultados.red.puerto587 = { exitoso: false, error: 'Timeout' };
                    console.log('Puerto 587: ❌ Timeout');
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                
                socket.on('error', (error) => {
                    resultados.red.puerto587 = { exitoso: false, error: error.message };
                    console.log('Puerto 587: ❌', error.message);
                    socket.destroy();
                    reject(error);
                });
                
                socket.connect(587, 'smtp.gmail.com');
            });
        } catch (error) {
            // Error ya manejado en el callback
        }
        
        // Registros MX
        try {
            const mxRecords = await dnsResolve('gmail.com', 'MX');
            resultados.red.mx = {
                exitoso: true,
                registros: mxRecords.length
            };
            console.log('Registros MX: ✅', mxRecords.length, 'encontrados');
        } catch (mxError) {
            resultados.red.mx = {
                exitoso: false,
                error: mxError.message
            };
            console.log('Registros MX: ❌', mxError.message);
        }
        console.log('');

        // 4. VERIFICACIÓN SMTP
        console.log('4️⃣ VERIFICACIÓN SMTP');
        console.log('-------------------');
        
        // Usar configuración directa del correo
        const emailUser = 'hdgomez0@gmail.com';
        const emailPass = 'wlstvjdckvhzxwvo';
        
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
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000
        };
        
        console.log('Configuración SMTP:');
        console.log('- Host:', config.host);
        console.log('- Puerto:', config.port);
        console.log('- Usuario:', config.auth.user);
        console.log('- Contraseña:', config.auth.pass ? '***CONFIGURADA***' : 'NO_CONFIGURADA');
        
        const transporter = nodemailer.createTransport(config);
        
        try {
            console.log('⏳ Verificando conexión SMTP...');
            await transporter.verify();
            resultados.smtp.verificacion = { exitoso: true };
            console.log('Conexión SMTP: ✅ Verificada');
        } catch (verifyError) {
            resultados.smtp.verificacion = {
                exitoso: false,
                codigo: verifyError.code,
                mensaje: verifyError.message,
                comando: verifyError.command,
                respuesta: verifyError.response
            };
            console.log('Conexión SMTP: ❌ Error');
            console.log('  Código:', verifyError.code);
            console.log('  Mensaje:', verifyError.message);
            console.log('  Comando:', verifyError.command);
            console.log('  Respuesta:', verifyError.response);
        }
        console.log('');

        // 5. ENVÍO DE CORREO DE PRUEBA
        console.log('5️⃣ ENVÍO DE CORREO DE PRUEBA');
        console.log('----------------------------');
        
        if (resultados.smtp.verificacion.exitoso) {
            const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Diagnóstico Completo - Servidor Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> ${resultados.sistema.hostname}</p>
                        <p><strong>Sistema:</strong> ${resultados.sistema.plataforma} ${resultados.sistema.version}</p>
                        <p><strong>Node.js:</strong> ${resultados.sistema.nodejs}</p>
                        <p><strong>Memoria:</strong> ${resultados.sistema.memoriaLibre} MB libre de ${resultados.sistema.memoriaTotal} MB</p>
                        <p><strong>Uptime:</strong> ${resultados.sistema.uptime} horas</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El servidor puede enviar correos correctamente.</p>
                    </div>
                </div>
            `;
            
            try {
                console.log('⏳ Enviando correo de prueba...');
                const result = await transporter.sendMail({
                    from: `Portal UCI <${emailUser}>`,
                    to: emailUser,
                    subject: '🔍 Diagnóstico Completo - Servidor Portal UCI',
                    html: emailHTML
                });
                
                resultados.email.envio = {
                    exitoso: true,
                    messageId: result.messageId,
                    destinatario: emailUser
                };
                
                console.log('Correo de prueba: ✅ Enviado');
                console.log('  Message ID:', result.messageId);
                console.log('  Destinatario:', emailUser);
            } catch (sendError) {
                resultados.email.envio = {
                    exitoso: false,
                    codigo: sendError.code,
                    mensaje: sendError.message,
                    comando: sendError.command,
                    respuesta: sendError.response
                };
                console.log('Correo de prueba: ❌ Error');
                console.log('  Código:', sendError.code);
                console.log('  Mensaje:', sendError.message);
            }
        } else {
            console.log('Correo de prueba: ⏭️ Omitido (SMTP no verificado)');
            resultados.email.envio = { exitoso: false, razon: 'SMTP no verificado' };
        }
        console.log('');

        // 6. RESUMEN FINAL
        console.log('📋 RESUMEN DEL DIAGNÓSTICO');
        console.log('==========================');
        
        const resumen = {
            sistema: resultados.sistema.plataforma ? '✅' : '❌',
            configuracion: resultados.configuracion.mailer.archivoExiste ? '✅' : '❌',
            dns: resultados.red.dns?.exitoso ? '✅' : '❌',
            puerto587: resultados.red.puerto587?.exitoso ? '✅' : '❌',
            smtp: resultados.smtp.verificacion?.exitoso ? '✅' : '❌',
            email: resultados.email.envio?.exitoso ? '✅' : '❌'
        };
        
        console.log('Sistema operativo:', resumen.sistema);
        console.log('Configuración:', resumen.configuracion);
        console.log('DNS:', resumen.dns);
        console.log('Puerto 587:', resumen.puerto587);
        console.log('SMTP:', resumen.smtp);
        console.log('Email:', resumen.email);
        console.log('');
        
        if (resumen.email === '✅') {
            console.log('🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
            console.log('El servidor está configurado correctamente para enviar correos.');
        } else {
            console.log('❌ DIAGNÓSTICO COMPLETADO CON ERRORES');
            console.log('Revisar los errores anteriores para identificar el problema.');
        }

    } catch (error) {
        console.log('');
        console.log('❌ ERROR CRÍTICO EN DIAGNÓSTICO');
        console.log('-------------------------------');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Ejecutar diagnóstico
diagnosticoCompleto();
