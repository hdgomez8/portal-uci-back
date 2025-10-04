const https = require('https');
const http = require('http');

/**
 * Sistema de Notificaciones con APIs Externas - Portal UCI
 * Integración con SendGrid, Mailgun, Resend y Amazon SES
 */

/**
 * Enviar correo usando SendGrid
 */
async function enviarCorreoSendGrid(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    const apiKey = process.env.SENDGRID_API_KEY || 'SG.tu-api-key-aqui';
    
    const data = JSON.stringify({
        personalizations: [{
            to: [{ email: destinatario }]
        }],
        from: { 
            email: fromEmail, 
            name: 'Portal UCI' 
        },
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
                    resolve({
                        exito: true,
                        messageId: `sendgrid-${Date.now()}`,
                        proveedor: 'SendGrid',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    reject(new Error(`SendGrid Error: ${res.statusCode} - ${responseData}`));
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
 * Enviar correo usando Mailgun
 */
async function enviarCorreoMailgun(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    const apiKey = process.env.MAILGUN_API_KEY || 'key-tu-api-key';
    const domain = process.env.MAILGUN_DOMAIN || 'tu-dominio.mailgun.org';
    
    const postData = new URLSearchParams({
        from: `Portal UCI <${fromEmail}>`,
        to: destinatario,
        subject: asunto,
        html: contenido
    });
    
    const options = {
        hostname: 'api.mailgun.net',
        port: 443,
        path: `/v3/${domain}/messages`,
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
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
                    resolve({
                        exito: true,
                        messageId: response.id || `mailgun-${Date.now()}`,
                        proveedor: 'Mailgun',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    reject(new Error(`Mailgun Error: ${res.statusCode} - ${responseData}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData.toString());
        req.end();
    });
}

/**
 * Enviar correo usando Resend
 */
async function enviarCorreoResend(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    const apiKey = process.env.RESEND_API_KEY || 're_tu-api-key';
    
    const data = JSON.stringify({
        from: `Portal UCI <${fromEmail}>`,
        to: [destinatario],
        subject: asunto,
        html: contenido
    });
    
    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
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
                    const response = JSON.parse(responseData);
                    resolve({
                        exito: true,
                        messageId: response.id || `resend-${Date.now()}`,
                        proveedor: 'Resend',
                        destinatario: destinatario,
                        statusCode: res.statusCode
                    });
                } else {
                    reject(new Error(`Resend Error: ${res.statusCode} - ${responseData}`));
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
 * Enviar correo usando Amazon SES
 */
async function enviarCorreoSES(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    const AWS = require('aws-sdk');
    
    // Configurar AWS
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'tu-access-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'tu-secret-key',
        region: process.env.AWS_REGION || 'us-east-1'
    });
    
    const ses = new AWS.SES();
    
    const params = {
        Destination: {
            ToAddresses: [destinatario]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: contenido
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: asunto
            }
        },
        Source: `Portal UCI <${fromEmail}>`
    };
    
    try {
        const result = await ses.sendEmail(params).promise();
        return {
            exito: true,
            messageId: result.MessageId,
            proveedor: 'Amazon SES',
            destinatario: destinatario,
            statusCode: 200
        };
    } catch (error) {
        throw new Error(`SES Error: ${error.message}`);
    }
}

/**
 * Enviar correo con fallback entre APIs
 */
async function enviarCorreoConAPIs(destinatario, asunto, contenido, fromEmail = 'hdgomez0@gmail.com') {
    console.log('📧 Iniciando envío con APIs externas...');
    console.log('📧 Destinatario:', destinatario);
    console.log('📧 Asunto:', asunto);
    
    const apis = [
        { nombre: 'SendGrid', funcion: enviarCorreoSendGrid },
        { nombre: 'Resend', funcion: enviarCorreoResend },
        { nombre: 'Mailgun', funcion: enviarCorreoMailgun },
        { nombre: 'Amazon SES', funcion: enviarCorreoSES }
    ];
    
    let ultimoError = null;
    
    for (let i = 0; i < apis.length; i++) {
        const api = apis[i];
        console.log(`🔧 Probando API ${i + 1}/${apis.length}: ${api.nombre}`);
        
        try {
            const resultado = await api.funcion(destinatario, asunto, contenido, fromEmail);
            console.log(`✅ Correo enviado exitosamente con ${api.nombre}`);
            console.log('📧 Message ID:', resultado.messageId);
            return resultado;
        } catch (error) {
            console.log(`❌ Error con ${api.nombre}:`, error.message);
            ultimoError = error;
            
            if (i < apis.length - 1) {
                console.log('🔄 Intentando con la siguiente API...');
                continue;
            }
        }
    }
    
    throw new Error(`Todas las APIs fallaron. Último error: ${ultimoError.message}`);
}

/**
 * Probar todas las APIs
 */
async function probarTodasLasAPIs() {
    console.log('🧪 Probando todas las APIs de correo...');
    
    const testEmail = 'hdgomez0@gmail.com';
    const testAsunto = '🧪 Test APIs Externas - Portal UCI';
    const testContenido = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🧪 Test de APIs Externas</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin-top: 0;">Sistema de Notificaciones</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Método:</strong> APIs externas con fallback</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <p style="margin: 0; color: #155724;"><strong>✅ Test exitoso</strong></p>
                <p style="margin: 5px 0 0 0; color: #155724;">El sistema de APIs externas está funcionando.</p>
            </div>
        </div>
    `;
    
    try {
        const resultado = await enviarCorreoConAPIs(testEmail, testAsunto, testContenido);
        console.log('✅ Test completado exitosamente');
        console.log('📧 API usada:', resultado.proveedor);
        console.log('📧 Message ID:', resultado.messageId);
        return resultado;
    } catch (error) {
        console.error('❌ Error en test:', error.message);
        throw error;
    }
}

module.exports = {
    enviarCorreoSendGrid,
    enviarCorreoMailgun,
    enviarCorreoResend,
    enviarCorreoSES,
    enviarCorreoConAPIs,
    probarTodasLasAPIs
};
