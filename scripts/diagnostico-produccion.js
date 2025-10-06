#!/usr/bin/env node

/**
 * Script de diagnóstico específico para servidor de producción
 */

const nodemailer = require('nodemailer');

async function diagnosticoProduccion() {
    console.log('🔍 DIAGNÓSTICO SERVIDOR DE PRODUCCIÓN');
    console.log('====================================');
    console.log('');

    // Información del servidor de producción
    console.log('📋 INFORMACIÓN DEL SERVIDOR:');
    console.log('============================');
    console.log(`Sistema: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Directorio: ${process.cwd()}`);
    console.log(`Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`Uptime: ${Math.round(process.uptime())} segundos`);
    console.log('');

    // Verificar variables de entorno en producción
    console.log('🔧 VARIABLES DE ENTORNO EN PRODUCCIÓN:');
    console.log('=====================================');
    console.log(`GMAIL_USER: ${process.env.GMAIL_USER || 'NO CONFIGURADO'}`);
    console.log(`GMAIL_PASS: ${process.env.GMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NO CONFIGURADO'}`);
    console.log('');

    // Test específico para servidor de producción
    console.log('📧 TEST ESPECÍFICO PARA PRODUCCIÓN:');
    console.log('===================================');
    
    try {
        // Configurar transporter para producción
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'hdgomez0@gmail.com',
                pass: process.env.GMAIL_PASS || 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            },
            // Configuraciones específicas para servidores de producción
            connectionTimeout: 60000, // 60 segundos
            greetingTimeout: 30000,    // 30 segundos
            socketTimeout: 60000      // 60 segundos
        });

        console.log('🔧 Configurando conexión para producción...');
        
        // Verificar conexión
        await transporter.verify();
        console.log('✅ Conexión Gmail verificada en producción');
        
        // Enviar correo de prueba
        console.log('📧 Enviando correo de prueba desde producción...');
        
        const mailOptions = {
            from: `Portal UCI Producción <${process.env.GMAIL_USER || 'hdgomez0@gmail.com'}>`,
            to: 'hdgomez0@gmail.com',
            subject: '🔍 Test Producción - Portal UCI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Test Producción - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor de Producción</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Directorio:</strong> ${process.cwd()}</p>
                        <p><strong>Memoria:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</p>
                        <p><strong>Uptime:</strong> ${Math.round(process.uptime())} segundos</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Test de producción completado</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos funciona correctamente en producción.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente desde producción');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📧 Response: ${info.response}`);
        console.log('');
        console.log('🎉 ¡SISTEMA FUNCIONANDO EN PRODUCCIÓN!');
        console.log('=====================================');
        console.log('El sistema de correos está funcionando correctamente en el servidor de producción.');
        
    } catch (error) {
        console.log('❌ Error en producción:', error.message);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('🔍 CAUSA: El servidor de producción bloquea SMTP');
            console.log('💡 SOLUCIÓN: Usar Gmail API (HTTPS)');
            console.log('💡 COMANDO: node scripts/configurar-gmail-api-alternativo.js');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('🔍 CAUSA: Timeout en servidor de producción');
            console.log('💡 SOLUCIÓN: Verificar firewall del servidor');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 CAUSA: Error de autenticación en producción');
            console.log('💡 SOLUCIÓN: Verificar variables de entorno');
            console.log('💡 COMANDO: Verificar .env en servidor');
        } else if (error.message.includes('blocked')) {
            console.log('🔍 CAUSA: Gmail bloquea conexiones del servidor');
            console.log('💡 SOLUCIÓN: Usar Gmail API (HTTPS)');
            console.log('💡 COMANDO: node scripts/configurar-gmail-api-alternativo.js');
        } else {
            console.log('🔍 CAUSA: Error desconocido en producción');
            console.log('💡 SOLUCIÓN: Revisar logs del servidor');
            console.log('💡 ALTERNATIVA: Usar Gmail API (HTTPS)');
        }
        
        console.log('');
        console.log('🚀 SOLUCIONES RECOMENDADAS:');
        console.log('==========================');
        console.log('1. Si SMTP está bloqueado:');
        console.log('   - Ejecutar: node scripts/configurar-gmail-api-alternativo.js');
        console.log('   - Configurar Gmail API con OAuth 2.0');
        console.log('   - Usar HTTPS en lugar de SMTP');
        console.log('');
        console.log('2. Si hay problemas de variables de entorno:');
        console.log('   - Verificar archivo .env en servidor');
        console.log('   - Configurar GMAIL_USER y GMAIL_PASS');
        console.log('   - Reiniciar aplicación');
        console.log('');
        console.log('3. Si hay problemas de red:');
        console.log('   - Contactar administrador del servidor');
        console.log('   - Verificar configuración de firewall');
        console.log('   - Usar Gmail API (puerto 443)');
    }
}

// Ejecutar diagnóstico de producción
diagnosticoProduccion();