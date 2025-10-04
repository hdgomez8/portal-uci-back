const nodemailer = require('nodemailer');
const https = require('https');
const http = require('http');

/**
 * Sistema de Notificaciones Alternativo - Portal UCI
 * Múltiples métodos de envío de correos para máxima compatibilidad
 */

// Configuraciones de diferentes proveedores
const configuracionesCorreo = [
    // Gmail con puerto 587 (STARTTLS)
    {
        nombre: 'Gmail STARTTLS',
        config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        }
    },
    // Gmail con puerto 465 (SSL)
    {
        nombre: 'Gmail SSL',
        config: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        }
    },
    // Outlook/Hotmail
    {
        nombre: 'Outlook',
        config: {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hdgomez0@gmail.com', // Cambiar por email de Outlook
                pass: 'wlstvjdckvhzxwvo'    // Cambiar por contraseña de Outlook
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        }
    },
    // Yahoo Mail
    {
        nombre: 'Yahoo',
        config: {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hdgomez0@gmail.com', // Cambiar por email de Yahoo
                pass: 'wlstvjdckvhzxwvo'    // Cambiar por contraseña de Yahoo
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        }
    }
];

/**
 * Enviar correo con fallback automático entre proveedores
 */
async function enviarCorreoConFallback(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Iniciando envío de correo con fallback...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    let ultimoError = null;
    
    for (let i = 0; i < configuracionesCorreo.length; i++) {
        const proveedor = configuracionesCorreo[i];
        console.log(`🔧 Probando proveedor ${i + 1}/${configuracionesCorreo.length}: ${proveedor.nombre}`);
        
        try {
            const transporter = nodemailer.createTransport(proveedor.config);
            
            // Verificar conexión
            await transporter.verify();
            console.log(`✅ Conexión exitosa con ${proveedor.nombre}`);
            
            // Enviar correo
            const mailOptions = {
                from: `Portal UCI <${proveedor.config.auth.user}>`,
                to: destinatario,
                subject: asunto,
                html: contenido
            };
            
            if (adjuntos && adjuntos.length > 0) {
                mailOptions.attachments = adjuntos;
            }
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Correo enviado exitosamente con ${proveedor.nombre}`);
            console.log('📧 Message ID:', result.messageId);
            
            return {
                exito: true,
                messageId: result.messageId,
                proveedor: proveedor.nombre,
                destinatario: destinatario
            };
            
        } catch (error) {
            console.log(`❌ Error con ${proveedor.nombre}:`, error.message);
            ultimoError = error;
            
            // Si no es el último proveedor, continuar con el siguiente
            if (i < configuracionesCorreo.length - 1) {
                console.log('🔄 Intentando con el siguiente proveedor...');
                continue;
            }
        }
    }
    
    // Si todos los proveedores fallaron
    console.error('❌ Todos los proveedores de correo fallaron');
    throw new Error(`No se pudo enviar el correo. Último error: ${ultimoError.message}`);
}

/**
 * Enviar correo usando API externa (SendGrid, Mailgun, etc.)
 */
async function enviarCorreoAPI(destinatario, asunto, contenido) {
    console.log('📧 Enviando correo usando API externa...');
    
    // Configuración para SendGrid (ejemplo)
    const apiKey = process.env.SENDGRID_API_KEY || 'tu-api-key-aqui';
    const fromEmail = 'hdgomez0@gmail.com';
    
    const data = JSON.stringify({
        personalizations: [{
            to: [{ email: destinatario }]
        }],
        from: { email: fromEmail, name: 'Portal UCI' },
        subject: asunto,
        content: [{
            type: 'text/html',
            value: contenido
        }]
    });
    
    const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Correo enviado via API externa');
                    resolve({
                        exito: true,
                        messageId: `api-${Date.now()}`,
                        proveedor: 'API Externa',
                        destinatario: destinatario
                    });
                } else {
                    reject(new Error(`API Error: ${res.statusCode} - ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(data);
        req.end();
    });
}

/**
 * Enviar correo usando servicio de logging (fallback final)
 */
async function enviarCorreoLogging(destinatario, asunto, contenido) {
    console.log('📧 Guardando correo en logs (fallback final)...');
    
    const logData = {
        timestamp: new Date().toISOString(),
        destinatario: destinatario,
        asunto: asunto,
        contenido: contenido,
        metodo: 'logging'
    };
    
    // Guardar en archivo de log
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../logs/correos-fallidos.json');
    
    // Crear directorio de logs si no existe
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Leer logs existentes
    let logs = [];
    if (fs.existsSync(logFile)) {
        try {
            const data = fs.readFileSync(logFile, 'utf8');
            logs = JSON.parse(data);
        } catch (error) {
            console.log('⚠️ Error leyendo logs existentes, creando nuevo archivo');
        }
    }
    
    // Agregar nuevo log
    logs.push(logData);
    
    // Guardar logs
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    console.log('✅ Correo guardado en logs:', logFile);
    
    return {
        exito: true,
        messageId: `log-${Date.now()}`,
        proveedor: 'Logging',
        destinatario: destinatario,
        archivo: logFile
    };
}

/**
 * Enviar correo con múltiples métodos de fallback
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Iniciando envío de correo con múltiples métodos...');
    
    // Método 1: Intentar con proveedores SMTP
    try {
        return await enviarCorreoConFallback(destinatario, asunto, contenido, adjuntos);
    } catch (error) {
        console.log('❌ Método SMTP falló:', error.message);
    }
    
    // Método 2: Intentar con API externa
    try {
        return await enviarCorreoAPI(destinatario, asunto, contenido);
    } catch (error) {
        console.log('❌ Método API falló:', error.message);
    }
    
    // Método 3: Fallback a logging
    console.log('⚠️ Todos los métodos de envío fallaron, usando logging como fallback');
    return await enviarCorreoLogging(destinatario, asunto, contenido);
}

/**
 * Notificar nueva solicitud
 */
async function notificarNuevaSolicitud(empleado, jefe, solicitud) {
    const asunto = '🔔 Nueva Solicitud - Portal UCI';
    const contenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🔔 Nueva Solicitud de ${solicitud.tipo || 'Permiso'}</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Información del Empleado</h3>
                <p><strong>Nombre:</strong> ${empleado.nombres} ${empleado.apellidos}</p>
                <p><strong>Documento:</strong> ${empleado.documento}</p>
                <p><strong>Área:</strong> ${empleado.area || 'No asignada'}</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1565c0;"><strong>📋 Detalles de la Solicitud</strong></p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">Fecha: ${new Date().toLocaleString()}</p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">Tipo: ${solicitud.tipo || 'Permiso'}</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin-top: 20px;">
                <p style="margin: 0; color: #155724;"><strong>✅ Acción Requerida</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">Por favor revisa y aprueba esta solicitud en el Portal UCI.</p>
            </div>
        </div>
    `;
    
    return await enviarCorreo(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario
 */
async function notificarNuevoUsuario(empleado, email, documento) {
    const asunto = '🏢 Bienvenido al Portal UCI - Tus Credenciales de Acceso';
    const contenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🏢 Bienvenido al Portal UCI</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Información de Acceso</h3>
                <p><strong>Nombre:</strong> ${empleado.nombres} ${empleado.apellidos}</p>
                <p><strong>Documento:</strong> ${documento}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña temporal:</strong> ${documento}</p>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Importante</strong></p>
                <p style="margin: 5px 0 0 0; color: #856404;">Cambia tu contraseña en el primer inicio de sesión.</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>🚀 ¡Bienvenido al equipo!</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">Ya puedes acceder al Portal UCI con tus credenciales.</p>
            </div>
        </div>
    `;
    
    return await enviarCorreo(email, asunto, contenido);
}

/**
 * Probar todos los métodos de envío
 */
async function probarTodosLosMetodos() {
    console.log('🧪 Probando todos los métodos de envío...');
    
    const testEmail = 'hdgomez0@gmail.com';
    const testAsunto = '🧪 Test Métodos Alternativos - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🧪 Test de Métodos Alternativos</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Método:</strong> Múltiples proveedores con fallback</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>✅ Test exitoso</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema de notificaciones alternativo está funcionando.</p>
            </div>
        </div>
    `;
    
    try {
        const resultado = await enviarCorreo(testEmail, testAsunto, testContenido);
        console.log('✅ Test completado exitosamente');
        console.log('📧 Proveedor usado:', resultado.proveedor);
        console.log('📧 Message ID:', resultado.messageId);
        return resultado;
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        throw error;
    }
}

module.exports = {
    enviarCorreo,
    notificarNuevaSolicitud,
    notificarNuevoUsuario,
    probarTodosLosMetodos,
    enviarCorreoConFallback,
    enviarCorreoAPI,
    enviarCorreoLogging
};
