const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Envía un correo electrónico usando Gmail API con método directo
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
    console.log('📧 Iniciando envío de correo con Gmail API Directo a:', to);
    console.log('📧 Asunto:', subject);
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    try {
        console.log('🔧 Enviando con Gmail API Directo...');
        
        // Crear el mensaje en formato MIME
        const message = {
            to: to,
            from: `Portal UCI <hdgomez0@gmail.com>`,
            subject: subject,
            html: html
        };
        
        // Si hay adjunto, agregarlo
        if (attachmentPath) {
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
        
        // Usar Gmail API directamente con credenciales
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../client_secret_526277260036-lgp3u2m0giv2dcghhvmfjefafd6ev0me.apps.googleusercontent.com.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.send']
        });
        
        const gmail = google.gmail({ version: 'v1', auth });
        
        // Enviar con Gmail API
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: mimeMessage
            }
        });
        
        console.log('✅ Correo enviado exitosamente con Gmail API Directo a:', to);
        console.log('📧 Message ID:', result.data.id);
        return {
            messageId: result.data.id,
            accepted: [to],
            rejected: [],
            response: result.data,
            provider: 'Gmail API Directo'
        };
        
    } catch (error) {
        console.error('❌ Error con Gmail API Directo:', error.message);
        throw new Error(`Error enviando correo con Gmail API Directo: ${error.message}`);
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
