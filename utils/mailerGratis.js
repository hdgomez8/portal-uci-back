const https = require('https');

/**
 * Sistema de Notificaciones GRATIS - Portal UCI
 * SendGrid: 100 correos/día GRATIS (3,000/mes)
 * Sin restricciones de destinatarios
 */

// Configuración de SendGrid GRATIS
const SENDGRID_API_KEY = 'SG.tu-api-key-aqui'; // Reemplazar con tu API Key real
const FROM_EMAIL = 'Portal UCI <noreply@tudominio.com>'; // Cambiar por tu dominio

/**
 * Enviar correo GRATIS usando SendGrid
 */
async function enviarCorreoGratis(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo GRATIS con SendGrid...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    // Crear el objeto de datos para SendGrid
    const mailData = {
        personalizations: [{
            to: [{ email: destinatario }]
        }],
        from: {
            email: 'noreply@tudominio.com', // Cambiar por tu dominio
            name: 'Portal UCI'
        },
        subject: asunto,
        content: [{
            type: 'text/html',
            value: contenido
        }]
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
    
    const data = JSON.stringify(mailData);
    
    const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
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
                    console.log('✅ Correo enviado exitosamente GRATIS');
                    console.log('📧 Status Code:', res.statusCode);
                    
                    resolve({
                        exito: true,
                        messageId: `sendgrid-${Date.now()}`,
                        proveedor: 'SendGrid GRATIS',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    console.log('❌ Error de SendGrid:', res.statusCode);
                    console.log('📧 Respuesta:', responseData);
                    reject(new Error(`SendGrid Error: ${res.statusCode} - ${responseData}`));
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
}

/**
 * Enviar correo a múltiples destinatarios GRATIS
 */
async function enviarCorreoMultiplesGratis(destinatarios, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo a múltiples destinatarios GRATIS...');
    console.log('📧 Destinatarios:', destinatarios.length);
    
    const resultados = [];
    
    for (const destinatario of destinatarios) {
        try {
            const resultado = await enviarCorreoGratis(destinatario, asunto, contenido, adjuntos);
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
 * Notificar nueva solicitud GRATIS
 */
async function notificarNuevaSolicitudGratis(empleado, jefe, solicitud) {
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
    
    return await enviarCorreoGratis(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario GRATIS
 */
async function notificarNuevoUsuarioGratis(empleado, email, documento) {
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
    
    return await enviarCorreoGratis(email, asunto, contenido);
}

/**
 * Enviar correo genérico GRATIS
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoGratis(destinatario, asunto, contenido, adjuntos);
}

/**
 * Probar sistema GRATIS
 */
async function probarSistemaGratis() {
    console.log('🧪 Probando sistema GRATIS...');
    
    const testEmails = [
        'hdgomez0@gmail.com',
        'Wilintonespitia2016@gmail.com',
        'test@ejemplo.com',
        'admin@empresa.com'
    ];
    
    const testAsunto = 'Test Sistema GRATIS - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Sistema GRATIS</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> SendGrid GRATIS</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Sistema GRATIS funcionando</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a cualquier email sin restricciones.</p>
            </div>
        </div>
    `;
    
    const resultados = [];
    
    for (const email of testEmails) {
        try {
            const resultado = await enviarCorreoGratis(email, testAsunto, testContenido);
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
    notificarNuevaSolicitudGratis,
    notificarNuevoUsuarioGratis,
    enviarCorreoMultiplesGratis,
    probarSistemaGratis,
    enviarCorreoGratis
};
