const express = require('express');
const router = express.Router();
const { diagnosticoInicio } = require('../scripts/diagnostico-inicio');

// Almacenar el estado del diagnóstico en memoria
let diagnosticoState = {
    ejecutando: false,
    pasos: [],
    resultado: null,
    error: null,
    timestamp: null
};

/**
 * Obtener el estado actual del diagnóstico
 */
router.get('/estado', (req, res) => {
    res.json({
        ejecutando: diagnosticoState.ejecutando,
        pasos: diagnosticoState.pasos,
        resultado: diagnosticoState.resultado,
        error: diagnosticoState.error,
        timestamp: diagnosticoState.timestamp,
        totalPasos: 6
    });
});

/**
 * Ejecutar diagnóstico paso a paso
 */
router.post('/ejecutar', async (req, res) => {
    if (diagnosticoState.ejecutando) {
        return res.status(400).json({ 
            error: 'Diagnóstico ya en ejecución',
            mensaje: 'Espera a que termine el diagnóstico actual'
        });
    }

    // Resetear estado
    diagnosticoState = {
        ejecutando: true,
        pasos: [],
        resultado: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    // Ejecutar diagnóstico en segundo plano
    setImmediate(async () => {
        try {
            await ejecutarDiagnosticoPasoAPaso();
        } catch (error) {
            diagnosticoState.error = error.message;
            diagnosticoState.ejecutando = false;
        }
    });

    res.json({ 
        mensaje: 'Diagnóstico iniciado',
        estado: 'ejecutando'
    });
});

/**
 * Resetear estado del diagnóstico
 */
router.post('/reset', (req, res) => {
    diagnosticoState = {
        ejecutando: false,
        pasos: [],
        resultado: null,
        error: null,
        timestamp: null
    };
    
    res.json({ mensaje: 'Estado del diagnóstico reseteado' });
});

/**
 * Ejecutar diagnóstico paso a paso con logging detallado
 */
async function ejecutarDiagnosticoPasoAPaso() {
    const nodemailer = require('nodemailer');
    const os = require('os');
    const dns = require('dns');
    const net = require('net');
    const { promisify } = require('util');

    const dnsLookup = promisify(dns.lookup);

    try {
        // Paso 1: Información del sistema
        agregarPaso('sistema', 'Verificando información del sistema...', 'ejecutando');
        
        const infoSistema = {
            plataforma: os.platform(),
            version: os.release(),
            nodejs: process.version,
            hostname: os.hostname(),
            memoriaLibre: Math.round(os.freemem() / 1024 / 1024),
            memoriaTotal: Math.round(os.totalmem() / 1024 / 1024),
            uptime: Math.round(os.uptime() / 3600),
            cpus: os.cpus().length
        };
        
        agregarPaso('sistema', `Sistema: ${infoSistema.plataforma} ${infoSistema.version} | Node.js: ${infoSistema.nodejs}`, 'completado');
        agregarPaso('sistema', `Memoria: ${infoSistema.memoriaLibre} MB libre de ${infoSistema.memoriaTotal} MB`, 'completado');
        agregarPaso('sistema', `Uptime: ${infoSistema.uptime} horas | CPUs: ${infoSistema.cpus}`, 'completado');

        // Paso 2: Configuración de correos
        agregarPaso('configuracion', 'Verificando configuración de correos...', 'ejecutando');
        
        const emailUser = 'hdgomez0@gmail.com';
        const emailPass = 'wlstvjdckvhzxwvo';
        
        agregarPaso('configuracion', `Usuario: ${emailUser}`, 'completado');
        agregarPaso('configuracion', 'Contraseña: ***CONFIGURADA***', 'completado');

        // Paso 3: Verificación DNS
        agregarPaso('dns', 'Verificando resolución DNS...', 'ejecutando');
        
        try {
            const dnsResult = await dnsLookup('smtp.gmail.com');
            agregarPaso('dns', `DNS resuelto: ${dnsResult.address}`, 'completado');
        } catch (dnsError) {
            agregarPaso('dns', `Error DNS: ${dnsError.message}`, 'error');
            throw dnsError;
        }

        // Paso 4: Verificación puerto 587
        agregarPaso('puerto', 'Verificando conectividad al puerto 587...', 'ejecutando');
        
        try {
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    agregarPaso('puerto', 'Puerto 587 accesible', 'completado');
                    socket.destroy();
                    resolve();
                });
                
                socket.on('timeout', () => {
                    agregarPaso('puerto', 'Timeout puerto 587', 'error');
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                
                socket.on('error', (error) => {
                    agregarPaso('puerto', `Error puerto 587: ${error.message}`, 'error');
                    socket.destroy();
                    reject(error);
                });
                
                socket.connect(587, 'smtp.gmail.com');
            });
        } catch (error) {
            throw error;
        }

        // Paso 5: Verificación SMTP
        agregarPaso('smtp', 'Verificando conexión SMTP...', 'ejecutando');
        
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
        
        agregarPaso('smtp', `Host: ${config.host}:${config.port}`, 'completado');
        agregarPaso('smtp', `Usuario: ${config.auth.user}`, 'completado');
        agregarPaso('smtp', 'Contraseña: ***CONFIGURADA***', 'completado');
        
        const transporter = nodemailer.createTransport(config);
        
        try {
            await transporter.verify();
            agregarPaso('smtp', 'Conexión SMTP verificada exitosamente', 'completado');
        } catch (verifyError) {
            agregarPaso('smtp', `Error SMTP: ${verifyError.code} - ${verifyError.message}`, 'error');
            throw verifyError;
        }

        // Paso 6: Envío de correo de prueba
        agregarPaso('email', 'Enviando correo de prueba...', 'ejecutando');
        
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">🔍 Diagnóstico en Tiempo Real - Portal UCI</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Servidor:</strong> ${infoSistema.hostname}</p>
                    <p><strong>Sistema:</strong> ${infoSistema.plataforma} ${infoSistema.version}</p>
                    <p><strong>Node.js:</strong> ${infoSistema.nodejs}</p>
                    <p><strong>Memoria:</strong> ${infoSistema.memoriaLibre} MB libre de ${infoSistema.memoriaTotal} MB</p>
                    <p><strong>Uptime:</strong> ${infoSistema.uptime} horas</p>
                </div>
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                    <p style="margin: 0; color: #155724;"><strong>✅ Diagnóstico completado exitosamente</strong></p>
                    <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos está funcionando correctamente.</p>
                </div>
            </div>
        `;
        
        try {
            const result = await transporter.sendMail({
                from: `Portal UCI <${emailUser}>`,
                to: emailUser,
                subject: '🔍 Diagnóstico en Tiempo Real - Portal UCI',
                html: emailHTML
            });
            
            agregarPaso('email', `Correo enviado exitosamente`, 'completado');
            agregarPaso('email', `Message ID: ${result.messageId}`, 'completado');
            agregarPaso('email', `Destinatario: ${emailUser}`, 'completado');
            
        } catch (emailError) {
            agregarPaso('email', `Error enviando correo: ${emailError.message}`, 'error');
            throw emailError;
        }

        // Diagnóstico completado exitosamente
        diagnosticoState.resultado = 'exitoso';
        diagnosticoState.ejecutando = false;
        agregarPaso('final', '🎉 Diagnóstico completado exitosamente', 'completado');

    } catch (error) {
        diagnosticoState.error = error.message;
        diagnosticoState.resultado = 'error';
        diagnosticoState.ejecutando = false;
        agregarPaso('error', `❌ Error: ${error.message}`, 'error');
    }
}

/**
 * Agregar un paso al estado del diagnóstico
 */
function agregarPaso(categoria, mensaje, estado) {
    const paso = {
        id: Date.now() + Math.random(),
        categoria,
        mensaje,
        estado,
        timestamp: new Date().toISOString()
    };
    
    diagnosticoState.pasos.push(paso);
    
    // Mantener solo los últimos 50 pasos para evitar que crezca demasiado
    if (diagnosticoState.pasos.length > 50) {
        diagnosticoState.pasos = diagnosticoState.pasos.slice(-50);
    }
}

module.exports = router;
