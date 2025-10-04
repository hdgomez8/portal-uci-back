const https = require('https');

/**
 * Sistema de Notificaciones con Resend - Portal UCI
 * API principal para envío de correos
 */

// Configuración de Resend
const RESEND_API_KEY = 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
const FROM_EMAIL = 'Portal UCI <noreply@resend.dev>';

/**
 * Enviar correo usando Resend
 */
async function enviarCorreoResend(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo con Resend...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    const data = JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        subject: asunto,
        html: contenido
    });
    
    console.log('📧 Datos JSON:', data);
    
    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
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
                    const response = JSON.parse(responseData);
                    console.log('✅ Correo enviado exitosamente con Resend');
                    console.log('📧 Message ID:', response.id);
                    resolve({
                        exito: true,
                        messageId: response.id,
                        proveedor: 'Resend',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    console.log('❌ Error de Resend:', res.statusCode);
                    console.log('📧 Respuesta:', responseData);
                    reject(new Error(`Resend Error: ${res.statusCode} - ${responseData}`));
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
    
    return await enviarCorreoResend(jefe.email, asunto, contenido);
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
    
    return await enviarCorreoResend(email, asunto, contenido);
}

/**
 * Enviar correo genérico
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoResend(destinatario, asunto, contenido, adjuntos);
}

/**
 * Probar Resend
 */
async function probarResend() {
    console.log('🧪 Probando Resend...');
    
    const testEmail = 'hdgomez0@gmail.com';
    const testAsunto = '🧪 Test Resend - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🧪 Test de Resend</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> Resend</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>✅ Resend funcionando</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema de notificaciones está operativo.</p>
            </div>
        </div>
    `;
    
    try {
        const resultado = await enviarCorreoResend(testEmail, testAsunto, testContenido);
        console.log('✅ Test completado exitosamente');
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
    probarResend,
    enviarCorreoResend
};
