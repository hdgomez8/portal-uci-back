#!/usr/bin/env node

/**
 * Script de diagnóstico completo para el sistema de correos
 */

const { sendMail } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');

async function diagnosticoCompleto() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
    console.log('===================================');
    console.log('');

    const pasos = [];
    let pasoActual = 0;

    function agregarPaso(id, descripcion, estado) {
        pasos.push({
            id: id,
            descripcion: descripcion,
            estado: estado,
            timestamp: new Date().toISOString()
        });
        console.log(`${estado === 'completado' ? '✅' : estado === 'error' ? '❌' : '🔧'} ${descripcion}`);
    }

    // Paso 1: Verificar variables de entorno
    agregarPaso('env', 'Verificando variables de entorno...', 'ejecutando');
    
    const variables = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
    };

    const variablesConfiguradas = Object.values(variables).filter(v => v).length;
    if (variablesConfiguradas === 4) {
        agregarPaso('env', 'Variables de entorno configuradas correctamente', 'completado');
    } else {
        agregarPaso('env', `Solo ${variablesConfiguradas}/4 variables configuradas`, 'error');
    }

    // Paso 2: Verificar conectividad
    agregarPaso('conectividad', 'Verificando conectividad a Gmail API...', 'ejecutando');
    
    try {
        const dns = require('dns');
        const { promisify } = require('util');
        const dnsLookup = promisify(dns.lookup);
        
        const dnsResult = await dnsLookup('gmail.googleapis.com');
        agregarPaso('conectividad', `DNS resuelto: ${dnsResult.address}`, 'completado');
    } catch (error) {
        agregarPaso('conectividad', `Error DNS: ${error.message}`, 'error');
    }

    // Paso 3: Verificar puerto 443
    agregarPaso('puerto', 'Verificando puerto 443 (HTTPS)...', 'ejecutando');
    
    try {
        const net = require('net');
        
        await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
                agregarPaso('puerto', 'Puerto 443 accesible', 'completado');
                socket.destroy();
                resolve();
            });
            
            socket.on('timeout', () => {
                agregarPaso('puerto', 'Timeout puerto 443', 'error');
                socket.destroy();
                reject(new Error('Timeout'));
            });
            
            socket.on('error', (error) => {
                agregarPaso('puerto', `Error puerto 443: ${error.message}`, 'error');
                socket.destroy();
                reject(error);
            });
            
            socket.connect(443, 'gmail.googleapis.com');
        });
    } catch (error) {
        agregarPaso('puerto', 'Puerto 443 no accesible', 'error');
    }

    // Paso 4: Test de envío de correo
    agregarPaso('email', 'Probando envío de correo...', 'ejecutando');
    
    try {
        const resultado = await sendMail(
            'hdgomez0@gmail.com',
            '🔍 Diagnóstico Completo - Portal UCI',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔍 Diagnóstico Completo - Portal UCI</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Información del Sistema</h3>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
                        <p><strong>Node.js:</strong> ${process.version}</p>
                        <p><strong>Método:</strong> Gmail API (OAuth 2.0)</p>
                        <p><strong>Puerto:</strong> HTTPS (443)</p>
                    </div>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico completado exitosamente</strong></p>
                        <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos con Gmail API está funcionando correctamente.</p>
                    </div>
                </div>
            `
        );
        
        agregarPaso('email', `Correo enviado exitosamente - Message ID: ${resultado.messageId}`, 'completado');
        
    } catch (error) {
        agregarPaso('email', `Error enviando correo: ${error.message}`, 'error');
    }

    // Resumen final
    const pasosCompletados = pasos.filter(p => p.estado === 'completado').length;
    const pasosConError = pasos.filter(p => p.estado === 'error').length;
    const totalPasos = pasos.length;

    console.log('');
    console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log('==========================');
    console.log(`✅ Pasos completados: ${pasosCompletados}/${totalPasos}`);
    console.log(`❌ Pasos con error: ${pasosConError}/${totalPasos}`);
    console.log(`📈 Progreso: ${Math.round((pasosCompletados / totalPasos) * 100)}%`);
    console.log('');

    if (pasosConError === 0) {
        console.log('🎉 ¡DIAGNÓSTICO EXITOSO!');
        console.log('========================');
        console.log('✅ Sistema de correos funcionando correctamente');
        console.log('✅ Gmail API operativo');
        console.log('✅ Conectividad verificada');
        console.log('✅ Envío de correos funcionando');
        return true;
    } else {
        console.log('⚠️ DIAGNÓSTICO CON PROBLEMAS');
        console.log('==========================');
        console.log('❌ Se encontraron errores en el sistema');
        console.log('💡 Revisar configuración y conectividad');
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    diagnosticoCompleto();
}

module.exports = { diagnosticoCompleto };
