#!/usr/bin/env node

/**
 * Script de diagnóstico específico para producción
 * Identifica problemas específicos del servidor de producción
 */

const { sendMail } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');

async function diagnosticoProduccion() {
    console.log('🔍 DIAGNÓSTICO DE PRODUCCIÓN');
    console.log('============================');
    console.log('');

    const pasos = [];
    let errores = [];

    function agregarPaso(id, descripcion, estado, detalle = '') {
        pasos.push({
            id: id,
            descripcion: descripcion,
            estado: estado,
            detalle: detalle,
            timestamp: new Date().toISOString()
        });
        
        const icono = estado === 'completado' ? '✅' : estado === 'error' ? '❌' : '🔧';
        console.log(`${icono} ${descripcion}`);
        if (detalle) console.log(`   ${detalle}`);
        
        if (estado === 'error') {
            errores.push({ id, descripcion, detalle });
        }
    }

    // Paso 1: Verificar variables de entorno
    agregarPaso('env', 'Verificando variables de entorno...', 'ejecutando');
    
    const variables = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
    };

    console.log('   Variables encontradas:');
    Object.entries(variables).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        const displayValue = value ? `${value.substring(0, 10)}...` : 'NO CONFIGURADA';
        console.log(`   ${status} ${key}: ${displayValue}`);
    });

    const variablesConfiguradas = Object.values(variables).filter(v => v).length;
    if (variablesConfiguradas === 4) {
        agregarPaso('env', 'Variables de entorno configuradas correctamente', 'completado');
    } else {
        agregarPaso('env', `Solo ${variablesConfiguradas}/4 variables configuradas`, 'error', 
            `Variables faltantes: ${Object.entries(variables).filter(([k,v]) => !v).map(([k]) => k).join(', ')}`);
    }

    // Paso 2: Verificar conectividad DNS
    agregarPaso('dns', 'Verificando resolución DNS...', 'ejecutando');
    
    try {
        const dns = require('dns');
        const { promisify } = require('util');
        const dnsLookup = promisify(dns.lookup);
        
        const dnsResult = await dnsLookup('gmail.googleapis.com');
        agregarPaso('dns', `DNS resuelto correctamente`, 'completado', `IP: ${dnsResult.address}`);
    } catch (error) {
        agregarPaso('dns', `Error en resolución DNS`, 'error', error.message);
    }

    // Paso 3: Verificar puerto 443
    agregarPaso('puerto', 'Verificando conectividad al puerto 443...', 'ejecutando');
    
    try {
        const net = require('net');
        
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(10000);
            
            socket.on('connect', () => {
                agregarPaso('puerto', 'Puerto 443 accesible', 'completado', 'Conexión HTTPS establecida');
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                agregarPaso('puerto', 'Timeout en puerto 443', 'error', 'No se pudo conectar en 10 segundos');
                socket.destroy();
                reject(new Error('Timeout'));
            });
            
            socket.on('error', (error) => {
                agregarPaso('puerto', `Error de conexión`, 'error', error.message);
                socket.destroy();
                reject(error);
            });
            
            socket.connect(443, 'gmail.googleapis.com');
        });
    } catch (error) {
        agregarPaso('puerto', 'Puerto 443 no accesible', 'error', error.message);
    }

    // Paso 4: Verificar Gmail API
    agregarPaso('gmail', 'Verificando Gmail API...', 'ejecutando');
    
    try {
        const { google } = require('googleapis');
        
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        // Test simple de autenticación
        await gmail.users.getProfile({ userId: 'me' });
        agregarPaso('gmail', 'Gmail API autenticado correctamente', 'completado', 'OAuth 2.0 funcionando');
        
    } catch (error) {
        agregarPaso('gmail', 'Error en Gmail API', 'error', error.message);
    }

    // Paso 5: Test de envío de correo
    agregarPaso('email', 'Probando envío de correo...', 'ejecutando');
    
    try {
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🔍 Diagnóstico Producción - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Diagnóstico de Producción - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Servidor:</strong> Producción</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API (OAuth 2.0)</p>
                        <p><strong>Puerto:</strong> HTTPS (443)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico de producción completado</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos en producción está funcionando correctamente.</p>
                    </div>
                </div>
            `
        );
        
        agregarPaso('email', 'Correo enviado exitosamente', 'completado', `Message ID: ${resultado.messageId}`);
        
    } catch (error) {
        agregarPaso('email', 'Error enviando correo', 'error', error.message);
    }

    // Resumen final
    const pasosCompletados = pasos.filter(p => p.estado === 'completado').length;
    const pasosConError = pasos.filter(p => p.estado === 'error').length;
    const totalPasos = pasos.length;

    console.log('');
    console.log('📊 RESUMEN DEL DIAGNÓSTICO DE PRODUCCIÓN:');
    console.log('==========================================');
    console.log(`✅ Pasos completados: ${pasosCompletados}/${totalPasos}`);
    console.log(`❌ Pasos con error: ${pasosConError}/${totalPasos}`);
    console.log(`📈 Progreso: ${Math.round((pasosCompletados / totalPasos) * 100)}%`);
    console.log('');

    if (errores.length > 0) {
        console.log('❌ ERRORES ENCONTRADOS:');
        console.log('========================');
        errores.forEach((error, index) => {
            console.log(`${index + 1}. ${error.descripcion}`);
            console.log(`   Detalle: ${error.detalle}`);
        });
        console.log('');
    }

    if (pasosConError === 0) {
        console.log('🎉 ¡DIAGNÓSTICO DE PRODUCCIÓN EXITOSO!');
        console.log('=====================================');
        console.log('✅ Sistema de correos funcionando correctamente');
        console.log('✅ Gmail API operativo en producción');
        console.log('✅ Conectividad verificada');
        console.log('✅ Envío de correos funcionando');
        return true;
    } else {
        console.log('⚠️ DIAGNÓSTICO DE PRODUCCIÓN CON PROBLEMAS');
        console.log('==========================================');
        console.log('❌ Se encontraron errores en el sistema de producción');
        console.log('💡 Revisar configuración y conectividad del servidor');
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    diagnosticoProduccion();
}

module.exports = { diagnosticoProduccion };
