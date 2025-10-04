const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'hdgomez0@gmail.com',
    pass: process.env.EMAIL_PASS || 'wlstvjdckvhzxwvo'
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256'
  },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,   // 30 segundos
  socketTimeout: 60000      // 60 segundos
});

/**
 * Envía un correo electrónico con o sin adjunto
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
  try {
    console.log('📧 Iniciando envío de correo a:', to);
    console.log('📧 Asunto:', subject);
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    const mailOptions = {
      from: 'Portal UCI <hdgomez0@gmail.com>',
      to,
      subject,
      html
    };
    
    if (attachmentPath) {
      // Verificar que el archivo existe
      const fs = require('fs');
      const path = require('path');
      if (!fs.existsSync(attachmentPath)) {
        throw new Error(`El archivo adjunto no existe: ${attachmentPath}`);
      }
      
      mailOptions.attachments = [
        {
          filename: path.basename(attachmentPath),
          path: attachmentPath,
          contentType: 'application/pdf'
        }
      ];
      console.log('📎 Archivo adjunto verificado:', attachmentPath);
    }
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente a:', to);
    console.log('📧 Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    console.error('❌ Detalles del error:', {
      to,
      subject,
      attachmentPath,
      errorMessage: error.message,
      errorCode: error.code
    });
    throw error;
  }
};

module.exports = { sendMail }; 