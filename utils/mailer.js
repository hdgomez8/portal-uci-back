const nodemailer = require('nodemailer');

// Configuración de Gmail SMTP
const GMAIL_USER = 'hdgomez0@gmail.com';
const GMAIL_PASS = 'wlstvjdckvhzxwvo';

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
 * Envía un correo electrónico usando Gmail SMTP
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
  try {
    console.log('📧 Iniciando envío de correo con Gmail SMTP a:', to);
    console.log('📧 Asunto:', subject);
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión Gmail verificada');
    
    // Configurar opciones del correo
    const mailOptions = {
      from: `Portal UCI <${GMAIL_USER}>`,
      to: to,
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
      
      mailOptions.attachments = [{
        filename: path.basename(attachmentPath),
        path: attachmentPath
      }];
      
      console.log('📎 Archivo adjunto verificado:', attachmentPath);
    }
    
    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Correo enviado exitosamente con Gmail SMTP a:', to);
    console.log('📧 Message ID:', info.messageId);
    
    return {
      messageId: info.messageId,
      accepted: [to],
      rejected: [],
      response: info.response
    };
    
  } catch (error) {
    console.error('❌ Error enviando correo con Gmail SMTP:', error);
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