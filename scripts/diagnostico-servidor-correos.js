#!/usr/bin/env node

/**
 * Script de diagnóstico completo para problemas de correos en servidor
 */

const nodemailer = require('nodemailer');
const { sendMail } = require('../utils/mailer');

async function diagnosticoServidorCorreos() {
    console.log('🔍 DIAGNÓSTICO COMPLETO - CORREOS EN SERVIDOR');
    console.log('============================================');
    console.log('');

    // Información del servidor
    console.log('📋 INFORMACIÓN DEL SERVIDOR:');
    console.log('============================');
    console.log(`Sistema: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Directorio: ${process.cwd()}`);
    console.log(`Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log('');

    // Verificar variables de entorno
    console.log('🔧 VARIABLES DE ENTORNO:');
    console.log('========================');
    console.log(`GMAIL_USER: ${process.env.GMAIL_USER || 'NO CONFIGURADO'}`);
    console.log(`GMAIL_PASS: ${process.env.GMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NO CONFIGURADO'}`);
    console.log('');

    // Test 1: Verificar conexión Gmail SMTP
    console.log('📧 TEST 1: CONEXIÓN GMAIL SMTP');
    console.log('==============================');
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'hdgomez0@gmail.com',
                pass: process.env.GMAIL_PASS || 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.verify();
        console.log('✅ Conexión Gmail SMTP: EXITOSA');
        console.log('✅ Servidor acepta conexiones SMTP');
    } catch (error) {
        console.log('❌ Conexión Gmail SMTP: FALLÓ');
        console.log(`❌ Error: ${error.message}`);
        console.log('');
        console.log('🔧 POSIBLES CAUSAS:');
        console.log('- Servidor bloquea puerto 587 (SMTP)');
        console.log('- Firewall bloquea conexiones salientes');
        console.log('- Credenciales incorrectas');
        console.log('- Gmail bloquea la conexión');
    }
    console.log('');

    // Test 2: Verificar conectividad de red
    console.log('🌐 TEST 2: CONECTIVIDAD DE RED');
    console.log('=============================');
    try {
        const net = require('net');
        
        // Test puerto 587 (SMTP)
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
                console.log('✅ Puerto 587 (SMTP): ACCESIBLE');
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                console.log('❌ Puerto 587 (SMTP): TIMEOUT');
                socket.destroy();
                reject(new Error('Timeout'));
            });
            
            socket.on('error', (error) => {
                console.log(`❌ Puerto 587 (SMTP): BLOQUEADO - ${error.message}`);
                socket.destroy();
                reject(error);
            });
            
            socket.connect(587, 'smtp.gmail.com');
        });
    } catch (error) {
        console.log('❌ Conectividad SMTP: FALLÓ');
        console.log('🔧 El servidor puede estar bloqueando SMTP');
    }

    // Test puerto 465 (SMTPS)
    try {
        const net = require('net');
        
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
                console.log('✅ Puerto 465 (SMTPS): ACCESIBLE');
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                console.log('❌ Puerto 465 (SMTPS): TIMEOUT');
                socket.destroy();
                reject(new Error('Timeout'));
            });
            
            socket.on('error', (error) => {
                console.log(`❌ Puerto 465 (SMTPS): BLOQUEADO - ${error.message}`);
                socket.destroy();
                reject(error);
            });
            
            socket.connect(465, 'smtp.gmail.com');
        });
    } catch (error) {
        console.log('❌ Conectividad SMTPS: FALLÓ');
    }

    // Test puerto 443 (HTTPS)
    try {
        const net = require('net');
        
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
                console.log('✅ Puerto 443 (HTTPS): ACCESIBLE');
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                console.log('❌ Puerto 443 (HTTPS): TIMEOUT');
                socket.destroy();
                reject(new Error('Timeout'));
            });
            
            socket.on('error', (error) => {
                console.log(`❌ Puerto 443 (HTTPS): BLOQUEADO - ${error.message}`);
                socket.destroy();
                reject(error);
            });
            
            socket.connect(443, 'smtp.gmail.com');
        });
    } catch (error) {
        console.log('❌ Conectividad HTTPS: FALLÓ');
    }
    console.log('');

    // Test 3: Envío de correo real
    console.log('📧 TEST 3: ENVÍO DE CORREO REAL');
    console.log('==============================');
    try {
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🔍 Diagnóstico Servidor - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Diagnóstico Servidor - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Directorio:</strong> ${process.cwd()}</p>
                        <p><strong>Memoria:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico completado</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos está funcionando desde el servidor.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Envío de correo: EXITOSO');
        console.log(`📧 Message ID: ${resultado.messageId}`);
        console.log(`📧 Provider: ${resultado.provider}`);
        console.log('✅ El sistema de correos funciona correctamente');
        
    } catch (error) {
        console.log('❌ Envío de correo: FALLÓ');
        console.log(`❌ Error: ${error.message}`);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('🔍 CAUSA: Conexión rechazada');
            console.log('💡 SOLUCIÓN: El servidor bloquea SMTP');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('🔍 CAUSA: Timeout de conexión');
            console.log('💡 SOLUCIÓN: Verificar firewall del servidor');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 CAUSA: Error de autenticación');
            console.log('💡 SOLUCIÓN: Verificar credenciales Gmail');
            console.log('💡 ALTERNATIVA: Regenerar contraseña de aplicación');
        } else if (error.message.includes('blocked')) {
            console.log('🔍 CAUSA: Gmail bloquea la conexión');
            console.log('💡 SOLUCIÓN: Verificar configuración de seguridad Gmail');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        } else {
            console.log('🔍 CAUSA: Error desconocido');
            console.log('💡 SOLUCIÓN: Revisar logs detallados');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        }
    }
    console.log('');

    // Recomendaciones finales
    console.log('🎯 RECOMENDACIONES:');
    console.log('==================');
    console.log('');
    console.log('1. Si SMTP está bloqueado:');
    console.log('   - Usar Gmail API (HTTPS)');
    console.log('   - Configurar OAuth 2.0');
    console.log('   - Usar credenciales de servicio');
    console.log('');
    console.log('2. Si hay problemas de autenticación:');
    console.log('   - Verificar contraseña de aplicación');
    console.log('   - Habilitar verificación en 2 pasos');
    console.log('   - Regenerar credenciales');
    console.log('');
    console.log('3. Si hay problemas de red:');
    console.log('   - Contactar administrador del servidor');
    console.log('   - Verificar configuración de firewall');
    console.log('   - Usar Gmail API (puerto 443)');
    console.log('');
    console.log('🚀 PRÓXIMO PASO:');
    console.log('Si SMTP está bloqueado, ejecutar: node scripts/configurar-gmail-api-alternativo.js');
}

// Ejecutar diagnóstico
diagnosticoServidorCorreos();
