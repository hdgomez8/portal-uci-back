const nodemailer = require('nodemailer');

/**
 * Sistema de Notificaciones con Gmail SMTP - Portal UCI
 * Envío a múltiples correos usando Gmail
 * Sin restricciones de destinatarios
 */

// Configuración de Gmail SMTP
const GMAIL_USER = 'hdgomez0@gmail.com'; // Tu email de Gmail
const GMAIL_PASS = 'wlstvjdckvhzxwvo'; // Tu clave de aplicación

// Crear transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Enviar correo usando Gmail SMTP
 */
async function enviarCorreoGmail(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo con Gmail SMTP...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    try {
        // Verificar conexión
        await transporter.verify();
        console.log('✅ Conexión Gmail verificada');
        
        // Configurar opciones del correo
        const mailOptions = {
            from: `Portal UCI <${GMAIL_USER}>`,
            to: destinatario,
            subject: asunto,
            html: contenido
        };
        
        // Si hay adjuntos, agregarlos
        if (adjuntos && adjuntos.length > 0) {
            mailOptions.attachments = adjuntos.map(adjunto => {
                if (typeof adjunto === 'string') {
                    // Es una ruta de archivo
                    return { path: adjunto };
                } else {
                    // Es un objeto adjunto
                    return adjunto;
                }
            });
            console.log('📎 Adjuntos:', adjuntos.length);
        }
        
        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Correo enviado exitosamente con Gmail');
        console.log('📧 Message ID:', info.messageId);
        
        return {
            exito: true,
            messageId: info.messageId,
            proveedor: 'Gmail SMTP',
            destinatario: destinatario,
            response: info.response
        };
        
    } catch (error) {
        console.error('❌ Error enviando correo con Gmail:', error.message);
        throw error;
    }
}

/**
 * Enviar correo a múltiples destinatarios
 */
async function enviarCorreoMultiplesGmail(destinatarios, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo a múltiples destinatarios con Gmail...');
    console.log('📧 Destinatarios:', destinatarios.length);
    
    const resultados = [];
    
    for (const destinatario of destinatarios) {
        try {
            const resultado = await enviarCorreoGmail(destinatario, asunto, contenido, adjuntos);
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
 * Notificar nueva solicitud
 */
async function notificarNuevaSolicitudGmail(empleado, jefe, solicitud) {
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
    
    return await enviarCorreoGmail(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario
 */
async function notificarNuevoUsuarioGmail(empleado, email, documento) {
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
    
    return await enviarCorreoGmail(email, asunto, contenido);
}

/**
 * Enviar correo genérico
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoGmail(destinatario, asunto, contenido, adjuntos);
}

/**
 * Probar Gmail SMTP
 */
async function probarGmailSMTP() {
    console.log('🧪 Probando Gmail SMTP...');
    
    const testEmails = [
        'hdgomez0@gmail.com',
        'Wilintonespitia2016@gmail.com',
        'test@ejemplo.com',
        'admin@empresa.com',
        'usuario@otrodominio.com'
    ];
    
    const testAsunto = 'Test Gmail SMTP - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Gmail SMTP</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>API:</strong> Gmail SMTP</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Gmail SMTP funcionando</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar a cualquier email sin restricciones.</p>
            </div>
        </div>
    `;
    
    const resultados = [];
    
    for (const email of testEmails) {
        try {
            const resultado = await enviarCorreoGmail(email, testAsunto, testContenido);
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
    notificarNuevaSolicitudGmail,
    notificarNuevoUsuarioGmail,
    enviarCorreoMultiplesGmail,
    probarGmailSMTP,
    enviarCorreoGmail
};
