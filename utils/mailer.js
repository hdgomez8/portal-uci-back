const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de Gmail Simple (PRINCIPAL) - Sin OAuth
const GMAIL_USER = process.env.GMAIL_USER || 'hdgomez0@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'wlstvjdckvhzxwvo';

// Configurar Gmail Simple
const gmailTransporter = nodemailer.createTransport({
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
 * Envía un correo electrónico usando Gmail Simple (Sin OAuth)
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
  console.log('📧 Iniciando envío de correo con Gmail Simple a:', to);
  console.log('📧 Asunto:', subject);
  console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
  
  try {
    console.log('🔧 Enviando con Gmail Simple...');
    
    // Verificar conexión Gmail
    await gmailTransporter.verify();
    console.log('✅ Conexión Gmail verificada');
    
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
    
    const info = await gmailTransporter.sendMail(mailOptions);
    
    console.log('✅ Correo enviado exitosamente con Gmail Simple a:', to);
    console.log('📧 Message ID:', info.messageId);
    return {
      messageId: info.messageId,
      accepted: [to],
      rejected: [],
      response: info.response,
      provider: 'Gmail Simple'
    };
    
  } catch (error) {
    console.error('❌ Error con Gmail Simple:', error.message);
    throw new Error(`Error enviando correo con Gmail Simple: ${error.message}`);
  }
};

module.exports = { sendMail };