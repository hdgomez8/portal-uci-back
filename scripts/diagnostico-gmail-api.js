#!/usr/bin/env node

/**
 * Script de diagnóstico para Gmail API
 */

const { sendMail } = require('../utils/mailer');

async function diagnosticoGmailAPI() {
    console.log('🔍 DIAGNÓSTICO GMAIL API');
    console.log('========================');
    console.log('');

    // Información del entorno
    console.log('📋 INFORMACIÓN DEL ENTORNO:');
    console.log('============================');
    console.log(`Sistema: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Directorio: ${process.cwd()}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NO CONFIGURADO'}`);
    console.log('');

    // Verificar variables de entorno
    console.log('🔧 VARIABLES DE ENTORNO:');
    console.log('========================');
    console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID || 'NO CONFIGURADO'}`);
    console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
    console.log(`GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || 'NO CONFIGURADO'}`);
    console.log(`GOOGLE_REFRESH_TOKEN: ${process.env.GOOGLE_REFRESH_TOKEN ? '***CONFIGURADO***' : 'NO CONFIGURADO'}`);
    console.log('');

    // Test de conectividad
    console.log('🌐 TEST DE CONECTIVIDAD:');
    console.log('========================');
    
    // Test DNS
    try {
        const dns = require('dns');
        const { promisify } = require('util');
        const dnsLookup = promisify(dns.lookup);
        
        const dnsResult = await dnsLookup('gmail.googleapis.com');
        console.log('✅ DNS Gmail API:', dnsResult.address);
    } catch (error) {
        console.log('❌ DNS Gmail API:', error.message);
    }

    // Test puerto 443
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
            
            socket.connect(443, 'gmail.googleapis.com');
        });
    } catch (error) {
        console.log('❌ Conectividad HTTPS: FALLÓ');
    }
    console.log('');

    // Test de envío de correo
    console.log('📧 TEST DE ENVÍO DE CORREO:');
    console.log('============================');
    
    try {
        console.log('📧 Enviando correo de prueba con Gmail API...');
        
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🔍 Diagnóstico Gmail API - Manual',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Diagnóstico Gmail API - Manual</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Entorno</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Directorio:</strong> ${process.cwd()}</p>
                        <p><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'NO CONFIGURADO'}</p>
                        <p><strong>Método:</strong> Gmail API (OAuth 2.0)</p>
                        <p><strong>Puerto:</strong> HTTPS (443)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico completado</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">Gmail API está funcionando correctamente.</p>
                    </div>
                </div>
            `
        );
        
        console.log('✅ Correo enviado exitosamente');
        console.log(`📧 Message ID: ${resultado.messageId}`);
        console.log(`📧 Provider: ${resultado.provider}`);
        console.log('');
        console.log('🎉 ¡GMAIL API FUNCIONANDO CORRECTAMENTE!');
        
        return true;
        
    } catch (error) {
        console.log('❌ Error enviando correo:', error.message);
        console.log('');
        console.log('🔧 DIAGNÓSTICO DEL ERROR:');
        console.log('========================');
        
        if (error.message.includes('invalid_grant')) {
            console.log('🔍 CAUSA: Refresh token expirado o inválido');
            console.log('💡 SOLUCIÓN: Generar nuevo refresh token');
            console.log('💡 COMANDO: node scripts/configurar-gmail-playground.js');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 CAUSA: Error de autenticación');
            console.log('💡 SOLUCIÓN: Verificar variables de entorno');
            console.log('💡 VERIFICAR: Archivo .env');
        } else if (error.message.includes('network')) {
            console.log('🔍 CAUSA: Problema de red');
            console.log('💡 SOLUCIÓN: Verificar conectividad del servidor');
            console.log('💡 VERIFICAR: Firewall del servidor');
        } else {
            console.log('🔍 CAUSA: Error desconocido');
            console.log('💡 SOLUCIÓN: Revisar logs detallados');
        }
        
        return false;
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticoGmailAPI();
}

module.exports = { diagnosticoGmailAPI };
