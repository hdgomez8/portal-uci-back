const https = require('https');

/**
 * Sistema de Notificaciones Multi-Email con Resend - Portal UCI
 * Maneja envío a múltiples destinatarios con fallback inteligente
 */

// Configuración de Resend
const RESEND_API_KEY = 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
const FROM_EMAIL = 'Portal UCI <noreply@resend.dev>';

// Lista de emails permitidos para pruebas (plan gratuito)
const EMAILS_PERMITIDOS = [
    'hdgomez0@gmail.com',
    'Wilintonespitia2016@gmail.com', // Agregar más emails aquí
    'admin@tudominio.com',
    'test@tudominio.com'
];

/**
 * Verificar si un email está permitido
 */
function esEmailPermitido(email) {
    return EMAILS_PERMITIDOS.includes(email.toLowerCase());
}

/**
 * Obtener email de fallback si el original no está permitido
 */
function obtenerEmailFallback(emailOriginal) {
    if (esEmailPermitido(emailOriginal)) {
        return emailOriginal;
    }
    
    // Usar el primer email permitido como fallback
    const emailFallback = EMAILS_PERMITIDOS[0];
    console.log(`⚠️ Email ${emailOriginal} no permitido, usando fallback: ${emailFallback}`);
    return emailFallback;
}

/**
 * Enviar correo con Resend (versión multi-email)
 */
async function enviarCorreoResend(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo con Resend (Multi-Email)...');
    console.log('📧 Destinatario original:', destinatario);
    
    // Verificar si el email está permitido
    const emailDestino = obtenerEmailFallback(destinatario);
    console.log('📧 Destinatario final:', emailDestino);
    console.log('📧 Asunto:', asunto);
    
    // Crear el objeto de datos para Resend
    const mailData = {
        from: FROM_EMAIL,
        to: [emailDestino],
        subject: asunto,
        html: contenido
    };
    
    // Si hay adjunto, agregarlo
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
                    filename: path.basename(adjunto),
                    content: base64Content,
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
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
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
                    const response = JSON.parse(responseData);
                    console.log('✅ Correo enviado exitosamente con Resend');
                    console.log('📧 Message ID:', response.id);
                    console.log('📧 Destinatario real:', emailDestino);
                    
                    resolve({
                        exito: true,
                        messageId: response.id,
                        proveedor: 'Resend',
                        destinatarioOriginal: destinatario,
                        destinatarioReal: emailDestino,
                        statusCode: res.statusCode,
                        usandoFallback: destinatario !== emailDestino
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
 * Enviar correo a múltiples destinatarios
 */
async function enviarCorreoMultiples(destinatarios, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo a múltiples destinatarios...');
    console.log('📧 Destinatarios:', destinatarios.length);
    
    const resultados = [];
    
    for (const destinatario of destinatarios) {
        try {
            const resultado = await enviarCorreoResend(destinatario, asunto, contenido, adjuntos);
            resultados.push(resultado);
            
            // Esperar 1 segundo entre envíos para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 1000));
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
 * Notificar nueva solicitud (versión multi-email)
 */
async function notificarNuevaSolicitud(empleado, jefe, solicitud) {
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
    
    return await enviarCorreoResend(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario (versión multi-email)
 */
async function notificarNuevoUsuario(empleado, email, documento) {
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
    
    return await enviarCorreoResend(email, asunto, contenido);
}

/**
 * Enviar correo genérico (versión multi-email)
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoResend(destinatario, asunto, contenido, adjuntos);
}

/**
 * Agregar email a la lista de permitidos
 */
function agregarEmailPermitido(email) {
    if (!EMAILS_PERMITIDOS.includes(email.toLowerCase())) {
        EMAILS_PERMITIDOS.push(email.toLowerCase());
        console.log(`✅ Email agregado a la lista de permitidos: ${email}`);
    } else {
        console.log(`ℹ️ Email ya está en la lista de permitidos: ${email}`);
    }
}

/**
 * Obtener lista de emails permitidos
 */
function obtenerEmailsPermitidos() {
    return EMAILS_PERMITIDOS;
}

/**
 * Probar sistema multi-email
 */
async function probarSistemaMultiEmail() {
    console.log('🧪 Probando sistema multi-email...');
    
    const testEmails = [
        'hdgomez0@gmail.com',
        'Wilintonespitia2016@gmail.com',
        'test@ejemplo.com'
    ];
    
    const testAsunto = 'Test Sistema Multi-Email - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Sistema Multi-Email</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> Resend Multi-Email</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Sistema multi-email operativo</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede manejar múltiples destinatarios.</p>
            </div>
        </div>
    `;
    
    const resultados = [];
    
    for (const email of testEmails) {
        try {
            const resultado = await enviarCorreoResend(email, testAsunto, testContenido);
            resultados.push(resultado);
            console.log(`✅ Test exitoso para ${email}`);
        } catch (error) {
            console.log(`❌ Test falló para ${email}:`, error.message);
            resultados.push({ exito: false, email, error: error.message });
        }
        
        // Esperar 1 segundo entre envíos
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return resultados;
}

module.exports = {
    enviarCorreo,
    notificarNuevaSolicitud,
    notificarNuevoUsuario,
    enviarCorreoMultiples,
    agregarEmailPermitido,
    obtenerEmailsPermitidos,
    probarSistemaMultiEmail,
    enviarCorreoResend
};
