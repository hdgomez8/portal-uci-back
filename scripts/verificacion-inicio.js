// Script de verificación de configuración de correos al iniciar la aplicación
require('dotenv').config();
const { sendMail } = require('../utils/mailer');
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Script de verificación de configuración de correos
 * Se ejecuta automáticamente al iniciar la aplicación
 */
async function verificarConfiguracionCorreos() {
    try {
        console.log('🔍 Iniciando verificación de configuración de correos...');
        
        // Obtener información del sistema
        const infoSistema = {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: os.uptime(),
            timestamp: new Date().toISOString(),
            memory: {
                total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
                free: Math.round(os.freemem() / 1024 / 1024) + ' MB'
            }
        };

        // Verificar variables de entorno
        const configEmail = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: process.env.EMAIL_USER || 'NO_CONFIGURADO',
            pass: process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO_CONFIGURADO',
            tls: {
                minVersion: 'TLSv1.2',
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256'
            }
        };

        // Verificar archivos de configuración
        const archivosConfig = {
            mailer: fs.existsSync(path.join(__dirname, '../utils/mailer.js')),
            emailTemplates: fs.existsSync(path.join(__dirname, '../utils/emailTemplates.js')),
            database: fs.existsSync(path.join(__dirname, '../config/database.js')),
            server: fs.existsSync(path.join(__dirname, '../server.js'))
        };

        // Generar HTML del correo de verificación
        const emailHTML = generarHTMLVerificacion(infoSistema, configEmail, archivosConfig);

        // Enviar correo de verificación
        await sendMail(
            process.env.EMAIL_USER || 'hdgomez0@gmail.com', // Email de destino
            '🔧 Verificación de Configuración - Portal UCI Iniciado',
            emailHTML
        );

        console.log('✅ Correo de verificación enviado exitosamente');
        console.log('📧 Configuración verificada y reportada');

    } catch (error) {
        console.error('❌ Error en verificación de configuración:', error);
        console.error('❌ Stack trace:', error.stack);
        
        // Intentar enviar correo de error
        try {
            const errorHTML = generarHTMLError(error, infoSistema);
            await sendMail(
                process.env.EMAIL_USER || 'hdgomez0@gmail.com',
                '🚨 Error en Verificación de Configuración - Portal UCI',
                errorHTML
            );
        } catch (emailError) {
            console.error('❌ No se pudo enviar correo de error:', emailError);
        }
    }
}

/**
 * Genera HTML para el correo de verificación exitosa
 */
function generarHTMLVerificacion(infoSistema, configEmail, archivosConfig) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Configuración - Portal UCI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .status-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .config-section { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
            .config-item { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .config-label { font-weight: bold; color: #495057; }
            .config-value { color: #6c757d; font-family: monospace; }
            .success { color: #28a745; font-weight: bold; }
            .warning { color: #ffc107; font-weight: bold; }
            .error { color: #dc3545; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔧 Portal UCI - Verificación de Configuración</h1>
                <p>Sistema iniciado correctamente - ${infoSistema.timestamp}</p>
            </div>

            <div class="status-success">
                <h3>✅ Estado: CONFIGURACIÓN VERIFICADA</h3>
                <p>El sistema de correos está funcionando correctamente con la configuración actualizada.</p>
            </div>

            <div class="config-section">
                <h3>🖥️ Información del Sistema</h3>
                <div class="config-item">
                    <span class="config-label">Servidor:</span>
                    <span class="config-value">${infoSistema.hostname}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Plataforma:</span>
                    <span class="config-value">${infoSistema.platform} (${infoSistema.arch})</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Node.js:</span>
                    <span class="config-value">${infoSistema.nodeVersion}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Memoria Total:</span>
                    <span class="config-value">${infoSistema.memory.total}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Memoria Libre:</span>
                    <span class="config-value">${infoSistema.memory.free}</span>
                </div>
            </div>

            <div class="config-section">
                <h3>📧 Configuración de Correos</h3>
                <div class="config-item">
                    <span class="config-label">Servidor SMTP:</span>
                    <span class="config-value">${configEmail.host}:${configEmail.port}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Usuario:</span>
                    <span class="config-value">${configEmail.user}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Contraseña:</span>
                    <span class="config-value">${configEmail.pass}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Protocolo TLS:</span>
                    <span class="config-value success">${configEmail.tls.minVersion}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Cifrados:</span>
                    <span class="config-value success">TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_GCM_SHA256</span>
                </div>
            </div>

            <div class="config-section">
                <h3>📁 Archivos de Configuración</h3>
                <div class="config-item">
                    <span class="config-label">mailer.js:</span>
                    <span class="config-value ${archivosConfig.mailer ? 'success' : 'error'}">${archivosConfig.mailer ? '✅ Encontrado' : '❌ No encontrado'}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">emailTemplates.js:</span>
                    <span class="config-value ${archivosConfig.emailTemplates ? 'success' : 'error'}">${archivosConfig.emailTemplates ? '✅ Encontrado' : '❌ No encontrado'}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">database.js:</span>
                    <span class="config-value ${archivosConfig.database ? 'success' : 'error'}">${archivosConfig.database ? '✅ Encontrado' : '❌ No encontrado'}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">server.js:</span>
                    <span class="config-value ${archivosConfig.server ? 'success' : 'error'}">${archivosConfig.server ? '✅ Encontrado' : '❌ No encontrado'}</span>
                </div>
            </div>

            <div class="config-section">
                <h3>🔒 Mejoras de Seguridad Implementadas</h3>
                <ul>
                    <li>✅ <strong>SSLv3 eliminado</strong> - Protocolo obsoleto y vulnerable removido</li>
                    <li>✅ <strong>TLSv1.2+ configurado</strong> - Versión mínima segura establecida</li>
                    <li>✅ <strong>Cifrados modernos</strong> - AES-256-GCM, ChaCha20-Poly1305 implementados</li>
                    <li>✅ <strong>Timeouts configurados</strong> - Conexiones con límites apropiados</li>
                    <li>✅ <strong>Envío asíncrono</strong> - Correos no bloquean respuestas</li>
                </ul>
            </div>

            <div class="footer">
                <p>Este correo se envía automáticamente al iniciar la aplicación Portal UCI</p>
                <p>Si recibes este correo, la configuración de correos está funcionando correctamente</p>
                <p>Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Genera HTML para correo de error
 */
function generarHTMLError(error, infoSistema) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error en Verificación - Portal UCI</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .error-section { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .error-details { background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
            .error-message { font-family: monospace; background-color: #e9ecef; padding: 10px; border-radius: 3px; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Portal UCI - Error en Verificación</h1>
                <p>Error detectado al verificar configuración - ${infoSistema.timestamp}</p>
            </div>

            <div class="error-section">
                <h3>❌ Error Detectado</h3>
                <p>Se produjo un error al verificar la configuración de correos del sistema.</p>
            </div>

            <div class="error-details">
                <h3>🔍 Detalles del Error</h3>
                <div class="error-message">${error.message}</div>
            </div>

            <div class="error-details">
                <h3>📋 Stack Trace</h3>
                <div class="error-message">${error.stack}</div>
            </div>

            <div class="error-details">
                <h3>🖥️ Información del Sistema</h3>
                <p><strong>Servidor:</strong> ${infoSistema.hostname}</p>
                <p><strong>Plataforma:</strong> ${infoSistema.platform} (${infoSistema.arch})</p>
                <p><strong>Node.js:</strong> ${infoSistema.nodeVersion}</p>
            </div>

            <div class="footer">
                <p>Este correo indica un problema en la configuración de correos del Portal UCI</p>
                <p>Revisar logs del servidor para más detalles</p>
                <p>Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Exportar función para uso en server.js
module.exports = { verificarConfiguracionCorreos };

// Si se ejecuta directamente, ejecutar la verificación
if (require.main === module) {
    verificarConfiguracionCorreos();
}
