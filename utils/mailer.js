const { google } = require('googleapis');
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

/**
 * Envía un correo electrónico usando Gmail API
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
    console.log('📧 Iniciando envío de correo con Gmail API a:', to);
    console.log('📧 Asunto original:', subject);
    console.log('📧 Asunto codificado:', encodeSubject(subject));
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    try {
        console.log('🔧 Enviando con Gmail API...');
        
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
            
            // Verificar que el archivo existe
            if (!fs.existsSync(attachmentPath)) {
                console.error(`❌ El archivo adjunto no existe: ${attachmentPath}`);
                throw new Error(`El archivo adjunto no existe: ${attachmentPath}`);
            }
            
            console.log('📎 Leyendo archivo adjunto:', attachmentPath);
            const fileBuffer = fs.readFileSync(attachmentPath);
            const base64Content = fileBuffer.toString('base64');
            
            // Detectar el tipo MIME basado en la extensión del archivo
            const ext = path.extname(attachmentPath).toLowerCase();
            let mimeType = 'application/pdf'; // Por defecto PDF
            if (ext === '.xlsx') {
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            } else if (ext === '.xls') {
                mimeType = 'application/vnd.ms-excel';
            } else if (ext === '.pdf') {
                mimeType = 'application/pdf';
            }
            
            message.attachments = [{
                filename: path.basename(attachmentPath),
                content: base64Content,
                type: mimeType
            }];
            
            console.log('✅ Archivo adjunto verificado:', attachmentPath);
            console.log('📎 Tipo MIME:', mimeType);
            console.log('📎 Tamaño del archivo:', fileBuffer.length, 'bytes');
        } else {
            console.log('⚠️ No se proporcionó ruta de adjunto');
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
        
    } catch (error) {
        console.error('❌ Error con Gmail API:', error.message);
        throw new Error(`Error enviando correo con Gmail API: ${error.message}`);
    }
};

// Función para codificar el asunto en UTF-8 según RFC 2047
function encodeSubject(subject) {
  // Asegurarse de que el subject sea una cadena válida
  if (!subject || typeof subject !== 'string') {
    return subject || '';
  }
  
  // Verificar si contiene caracteres no ASCII (incluyendo emojis)
  // Los emojis son caracteres multi-byte en UTF-8
  const hasNonASCII = /[^\x00-\x7F]/.test(subject);
  
  if (!hasNonASCII) {
    return subject;
  }
  
  try {
    // Asegurar que el string esté en UTF-8
    // Convertir a Buffer explícitamente con UTF-8
    const utf8Buffer = Buffer.from(subject, 'utf8');
    
    // Verificar que la conversión fue correcta
    const decoded = utf8Buffer.toString('utf8');
    if (decoded !== subject) {
      console.warn('⚠️ Advertencia: El asunto puede tener problemas de codificación');
    }
    
    // Usar codificación Base64 para el asunto
    const encoded = utf8Buffer.toString('base64');
    
    // Dividir en líneas de máximo 76 caracteres (incluyendo el prefijo =?UTF-8?B? y sufijo ?=)
    // El prefijo tiene 10 caracteres, así que podemos usar hasta 66 caracteres de base64 por línea
    const maxLineLength = 66;
    
    if (encoded.length <= maxLineLength) {
      return `=?UTF-8?B?${encoded}?=`;
    }
    
    // Dividir en múltiples líneas según RFC 2047
    let result = '';
    for (let i = 0; i < encoded.length; i += maxLineLength) {
      const chunk = encoded.substr(i, maxLineLength);
      if (i === 0) {
        result += `=?UTF-8?B?${chunk}`;
      } else {
        result += `\r\n =?UTF-8?B?${chunk}`;
      }
    }
    result += '?=';
    
    return result;
  } catch (error) {
    console.error('❌ Error codificando asunto:', error);
    // Si falla la codificación, devolver el asunto sin codificar (mejor que nada)
    return subject;
  }
}

// Función para crear mensaje MIME
function createMimeMessage(message) {
  const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
  let mimeMessage = '';
  
  mimeMessage += `From: ${message.from}\r\n`;
  mimeMessage += `To: ${message.to}\r\n`;
  mimeMessage += `Subject: ${encodeSubject(message.subject)}\r\n`;
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