const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración OAuth 2.0 para Gmail API
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || '526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com',
    process.env.GOOGLE_CLIENT_SECRET || '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',
    process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
);

// Configurar credenciales
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Configuración Gmail SMTP como fallback
const smtpConfig = {
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'hdgomez0@gmail.com',
        pass: process.env.GMAIL_PASS || 'wlstvjdckvhzxwvo'
    }
};

/**
 * Envía un correo electrónico usando Gmail API con fallback a Gmail SMTP
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
    console.log('📧 Iniciando envío de correo híbrido a:', to);
    console.log('📧 Asunto:', subject);
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    // Intentar primero con Gmail API
    try {
        console.log('🔧 Intentando con Gmail API...');
        
        // Crear el mensaje en formato MIME
        const message = {
            to: to,
            from: `Portal UCI <hdgomez0@gmail.com>`,
            subject: subject,
            html: html
        };
        
        // Si hay adjunto, agregarlo
        if (attachmentPath) {
            const fs = require('fs');
            const path = require('path');
            
            if (!fs.existsSync(attachmentPath)) {
                throw new Error(`El archivo adjunto no existe: ${attachmentPath}`);
            }
            
            const fileBuffer = fs.readFileSync(attachmentPath);
            const base64Content = fileBuffer.toString('base64');
            
            message.attachments = [{
                filename: path.basename(attachmentPath),
                content: base64Content,
                type: 'application/pdf'
            }];
            
            console.log('📎 Archivo adjunto verificado:', attachmentPath);
        }
        
        // Crear el mensaje MIME
        const mimeMessage = createMimeMessage(message);
        
        // Enviar con Gmail API
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: mimeMessage
            }
        });
        
        console.log('✅ Correo enviado exitosamente con Gmail API a:', to);
        console.log('📧 Message ID:', result.data.id);
        return {
            messageId: result.data.id,
            accepted: [to],
            rejected: [],
            response: result.data,
            provider: 'Gmail API'
        };
        
    } catch (apiError) {
        console.error('❌ Error con Gmail API:', apiError.message);
        console.log('🔄 Intentando con Gmail SMTP como fallback...');
        
        // Fallback a Gmail SMTP
        try {
            const transporter = nodemailer.createTransport(smtpConfig);
            
            // Verificar conexión SMTP
            await transporter.verify();
            console.log('✅ Conexión SMTP verificada');
            
            const mailOptions = {
                from: `Portal UCI <${smtpConfig.auth.user}>`,
                to: to,
                subject: subject,
                html: html
            };
            
            // Agregar adjunto si existe
            if (attachmentPath) {
                const fs = require('fs');
                const path = require('path');
                
                if (fs.existsSync(attachmentPath)) {
                    mailOptions.attachments = [{
                        filename: path.basename(attachmentPath),
                        path: attachmentPath
                    }];
                    console.log('📎 Archivo adjunto agregado:', path.basename(attachmentPath));
                }
            }
            
            const info = await transporter.sendMail(mailOptions);
            
            console.log('✅ Correo enviado exitosamente con Gmail SMTP a:', to);
            console.log('📧 Message ID:', info.messageId);
            return {
                messageId: info.messageId,
                accepted: [to],
                rejected: [],
                response: info.response,
                provider: 'Gmail SMTP (Fallback)'
            };
            
        } catch (smtpError) {
            console.error('❌ Error con Gmail SMTP:', smtpError.message);
            throw new Error(`Error enviando correo: Gmail API falló (${apiError.message}) y Gmail SMTP falló (${smtpError.message})`);
        }
    }
};

// Función para crear mensaje MIME
function createMimeMessage(message) {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    let mimeMessage = '';
    
    mimeMessage += `From: ${message.from}\r\n`;
    mimeMessage += `To: ${message.to}\r\n`;
    mimeMessage += `Subject: ${message.subject}\r\n`;
    mimeMessage += `MIME-Version: 1.0\r\n`;
    mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    
    // Cuerpo del mensaje
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    mimeMessage += `${message.html}\r\n\r\n`;
    
    // Adjuntos
    if (message.attachments) {
        message.attachments.forEach(attachment => {
            mimeMessage += `--${boundary}\r\n`;
            mimeMessage += `Content-Type: ${attachment.type}\r\n`;
            mimeMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
            mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
            mimeMessage += `${attachment.content}\r\n\r\n`;
        });
    }
    
    mimeMessage += `--${boundary}--\r\n`;
    
    return Buffer.from(mimeMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = { sendMail };
