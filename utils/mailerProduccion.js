const nodemailer = require('nodemailer');

/**
 * Sistema de Notificaciones para PRODUCCIÓN - Portal UCI
 * Múltiples proveedores con fallback automático
 * Optimizado para servidores de producción
 */

// Configuración de múltiples proveedores
const configuracionesCorreo = [
    // 1. Gmail SMTP (Principal)
    {
        nombre: 'Gmail SMTP',
        config: {
            service: 'gmail',
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 10 // 10 correos por segundo
        }
    },
    // 2. Gmail SMTP Alternativo (Puerto 465)
    {
        nombre: 'Gmail SMTP SSL',
        config: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    },
    // 3. Gmail SMTP Alternativo (Puerto 587)
    {
        nombre: 'Gmail SMTP TLS',
        config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo'
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    }
];

/**
 * Enviar correo con fallback automático
 */
async function enviarCorreoProduccion(destinatario, asunto, contenido, adjuntos = []) {
    console.log('📧 Iniciando envío de correo en PRODUCCIÓN...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    let ultimoError = null;
    
    // Intentar con cada configuración
    for (let i = 0; i < configuracionesCorreo.length; i++) {
        const proveedor = configuracionesCorreo[i];
        console.log(`🔧 Probando proveedor ${i + 1}/${configuracionesCorreo.length}: ${proveedor.nombre}`);
        
        try {
            // Crear transporter
            const transporter = nodemailer.createTransport(proveedor.config);
            
            // Verificar conexión
            await transporter.verify();
            console.log(`✅ Conexión exitosa con ${proveedor.nombre}`);
            
            // Configurar opciones del correo
            const mailOptions = {
                from: `Portal UCI <hdgomez0@gmail.com>`,
                to: destinatario,
                subject: asunto,
                html: contenido
            };
            
            // Si hay adjuntos, agregarlos
            if (adjuntos && adjuntos.length > 0) {
                mailOptions.attachments = adjuntos.map(adjunto => {
                    if (typeof adjunto === 'string') {
                        return { path: adjunto };
                    } else {
                        return adjunto;
                    }
                });
                console.log('📎 Adjuntos:', adjuntos.length);
            }
            
            // Enviar correo
            const info = await transporter.sendMail(mailOptions);
            
            console.log(`✅ Correo enviado exitosamente con ${proveedor.nombre}`);
            console.log('📧 Message ID:', info.messageId);
            
            return {
                exito: true,
                messageId: info.messageId,
                proveedor: proveedor.nombre,
                destinatario: destinatario,
                response: info.response
            };
            
        } catch (error) {
            console.error(`❌ Error con ${proveedor.nombre}:`, error.message);
            ultimoError = error;
            
            if (i === configuracionesCorreo.length - 1) {
                console.error('❌ Todos los proveedores fallaron');
                throw ultimoError;
            } else {
                console.log('🔄 Intentando con el siguiente proveedor...');
                // Esperar 2 segundos antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

/**
 * Enviar correo a múltiples destinatarios en producción
 */
async function enviarCorreoMultiplesProduccion(destinatarios, asunto, contenido, adjuntos = []) {
    console.log('📧 Enviando correo a múltiples destinatarios en PRODUCCIÓN...');
    console.log('📧 Destinatarios:', destinatarios.length);
    
    const resultados = [];
    
    for (const destinatario of destinatarios) {
        try {
            const resultado = await enviarCorreoProduccion(destinatario, asunto, contenido, adjuntos);
            resultados.push(resultado);
            
            // Esperar 2 segundos entre envíos para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 2000));
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
 * Notificar nueva solicitud en producción
 */
async function notificarNuevaSolicitudProduccion(empleado, jefe, solicitud) {
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
    
    return await enviarCorreoProduccion(jefe.email, asunto, contenido);
}

/**
 * Notificar nuevo usuario en producción
 */
async function notificarNuevoUsuarioProduccion(empleado, email, documento) {
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
    
    return await enviarCorreoProduccion(email, asunto, contenido);
}

/**
 * Enviar correo genérico en producción
 */
async function enviarCorreo(destinatario, asunto, contenido, adjuntos = []) {
    return await enviarCorreoProduccion(destinatario, asunto, contenido, adjuntos);
}

/**
 * Probar sistema en producción
 */
async function probarSistemaProduccion() {
    console.log('🧪 Probando sistema en PRODUCCIÓN...');
    
    const testEmails = [
        'hdgomez0@gmail.com',
        'Wilintonespitia2016@gmail.com'
    ];
    
    const testAsunto = 'Test Producción - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Producción</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Entorno:</strong> PRODUCCIÓN</p>
                <p><strong>Estado:</strong> Funcionando correctamente</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>Sistema funcionando en producción</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema puede enviar correos desde el servidor.</p>
            </div>
        </div>
    `;
    
    const resultados = [];
    
    for (const email of testEmails) {
        try {
            const resultado = await enviarCorreoProduccion(email, testAsunto, testContenido);
            resultados.push(resultado);
            console.log(`✅ Test exitoso para ${email}`);
        } catch (error) {
            console.log(`❌ Test falló para ${email}:`, error.message);
            resultados.push({ exito: false, email, error: error.message });
        }
        
        // Esperar 2 segundos entre envíos
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return resultados;
}

module.exports = {
    enviarCorreo,
    notificarNuevaSolicitudProduccion,
    notificarNuevoUsuarioProduccion,
    enviarCorreoMultiplesProduccion,
    probarSistemaProduccion,
    enviarCorreoProduccion
};
