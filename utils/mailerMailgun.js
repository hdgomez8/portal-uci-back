const https = require('https');

/**
 * Sistema de Notificaciones con Mailgun - Portal UCI
 * 5,000 correos/mes GRATIS
 * Envío a múltiples correos sin restricciones
 */

// Configuración de Mailgun GRATIS
const MAILGUN_API_KEY = '344b1c8068f223bf14b5aa8ed674f9db-556e0aa9-e8c291cb'; // Tu API Key real
const MAILGUN_DOMAIN = 'sandbox116ae06cb0ca458e89e5d816dcff41d3.mailgun.org'; // Tu dominio de Mailgun

/**
 * Enviar correo usando Mailgun
 */
async function enviarCorreoMailgun(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo con Mailgun...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    try {
        // Crear datos para Mailgun
        const mailData = {
            from: `Portal UCI <noreply@${MAILGUN_DOMAIN}>`,
            to: destinatario,
            subject: asunto,
            html: contenido
        };
        
        // Si hay adjuntos, agregarlos
        if (adjuntos && adjuntos.length > 0) {
            const fs = require('fs');
            const path = require('path');
            
            mailData.attachments = adjuntos.map(adjunto => {
                if (typeof adjunto === 'string') {
                    // Es una ruta de archivo
                    if (!fs.existsSync(adjunto)) {
                        throw new Error(`El archivo adjunto no existe: ${adjunto}`);
                    }
                    
                    const fileBuffer = fs.readFileSync(adjunto);
                    const base64Content = fileBuffer.toString('base64');
                    
                    return {
                        content: base64Content,
                        filename: path.basename(adjunto),
                        type: 'application/pdf',
                        disposition: 'attachment'
                    };
                } else {
                    // Es un objeto adjunto
                    return adjunto;
                }
            });
            
            console.log('📎 Adjuntos:', adjuntos.length);
        }
        
        // Convertir a formato URL-encoded para Mailgun
        const formData = new URLSearchParams();
        formData.append('from', mailData.from);
        formData.append('to', mailData.to);
        formData.append('subject', mailData.subject);
        formData.append('html', mailData.html);
        
        if (mailData.attachments) {
            mailData.attachments.forEach((adjunto, index) => {
                formData.append(`attachment[${index}]`, adjunto.content);
                formData.append(`attachment[${index}][filename]`, adjunto.filename);
            });
        }
        
        const data = formData.toString();
        
        const options = {
            hostname: 'api.mailgun.net',
            port: 443,
            path: `/v3/${MAILGUN_DOMAIN}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data, 'utf8')
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
                        console.log('✅ Correo enviado exitosamente con Mailgun');
                        console.log('📧 Status Code:', res.statusCode);
                        
                        resolve({
                            exito: true,
                            messageId: `mailgun-${Date.now()}`,
                            proveedor: 'Mailgun GRATIS',
                            destinatario: destinatario,
                            statusCode: res.statusCode
                        });
                    } else {
                        console.log('❌ Error de Mailgun:', res.statusCode);
                        console.log('📧 Respuesta:', responseData);
                        reject(new Error(`Mailgun Error: ${res.statusCode} - ${responseData}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('❌ Error de conexión:', error.message);
                reject(error);
            });
            
            req.write(data);
            req.end();
        });
        
    } catch (error) {
        console.error('❌ Error enviando correo con Mailgun:', error.message);
        throw error;
    }
}

/**
 * Enviar correo a múltiples destinatarios
 */
async function enviarCorreoMultiplesMailgun(destinatarios, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo a múltiples destinatarios con Mailgun...');
    console.log('📧 Destinatarios:', destinatarios.length);
    
    const resultados = [];
    
    for (const destinatario of destinatarios) {
        try {
            const resultado = await enviarCorreoMailgun(destinatario, asunto, contenido, adjuntos);
            resultados.push(resultado);
            
            // Esperar 0.5 segundos entre envíos para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Error enviando a ${destinatario}:`, error.message);
            resultados.push({
                exito: false,
                destinatario: destinatario,
                error: error.message
            });
        }
    }
    
    return resultados;
}

/**
 * Notificar nueva solicitud
 */
async function notificarNuevaSolicitudMailgun(empleado, jefe, solicitud) {
    const asunto = 'Nueva Solicitud - Portal UCI';
    const contenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Nueva Solicitud de ${solicitud.tipo || 'Permiso'}</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Informacion del Empleado</h3>
                <p><strong>Nombre:</strong> ${empleado.nombres} ${empleado.apellidos}</p>
                <p><strong>Documento:</strong> ${empleado.documento}</p>
                <p><strong>Area:</strong> ${empleado.area || 'No asignada'}</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; color: #1565c0;"><strong>Detalles de la Solicitud</strong></p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">Fecha: ${new Date().toLocaleString()}</p>
                <p style="margin: 5px 0 0 0; color: #1565c0;">Tipo: ${solicitud.tipo || 'Permiso'}</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin-top: 20px;">
                <p style="margin: 0; color: #155724;"><strong>Accion Requerida</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">Por favor revisa y aprueba esta solicitud en el Portal UCI.</p>
            </div>
        </div>
    `;
    
    return await enviarCorreoMailgun(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario
 */
async function notificarNuevoUsuarioMailgun(empleado, email, documento) {
    const asunto = 'Bienvenido al Portal UCI - Tus Credenciales de Acceso';
    const contenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Bienvenido al Portal UCI</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Informacion de Acceso</h3>
                <p><strong>Nombre:</strong> ${empleado.nombres} ${empleado.apellidos}</p>
                <p><strong>Documento:</strong> ${documento}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contrasena temporal:</strong> ${documento}</p>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>Importante</strong></p>
                <p style="margin: 5px 0 0 0; color: #856404;">Cambia tu contrasena en el primer inicio de sesion.</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Bienvenido al equipo!</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">Ya puedes acceder al Portal UCI con tus credenciales.</p>
            </div>
        </div>
    `;
    
    return await enviarCorreoMailgun(email, asunto, contenido);
}

/**
 * Enviar correo genérico
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoMailgun(destinatario, asunto, contenido, adjuntos);
}

/**
 * Probar Mailgun
 */
async function probarMailgun() {
    console.log('🧪 Probando Mailgun...');
    
    const testEmails = [
        'hdgomez0@gmail.com',
        'Wilintonespitia2016@gmail.com',
        'test@ejemplo.com',
        'admin@empresa.com',
        'usuario@otrodominio.com'
    ];
    
    const testAsunto = 'Test Mailgun - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Mailgun</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> Mailgun GRATIS</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Mailgun funcionando</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a cualquier email sin restricciones.</p>
            </div>
        </div>
    `;
    
    const resultados = [];
    
    for (const email of testEmails) {
        try {
            const resultado = await enviarCorreoMailgun(email, testAsunto, testContenido);
            resultados.push(resultado);
            console.log(`✅ Test exitoso para ${email}`);
        } catch (error) {
            console.log(`❌ Test falló para ${email}:`, error.message);
            resultados.push({ exito: false, email, error: error.message });
        }
        
        // Esperar 0.5 segundos entre envíos
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return resultados;
}

module.exports = {
    enviarCorreo,
    notificarNuevaSolicitudMailgun,
    notificarNuevoUsuarioMailgun,
    enviarCorreoMultiplesMailgun,
    probarMailgun,
    enviarCorreoMailgun
};
