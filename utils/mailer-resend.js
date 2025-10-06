const https = require('https');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de Resend (PRINCIPAL)
const RESEND_API_KEY = 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
const FROM_EMAIL = 'Portal UCI <noreply@resend.dev>';

// Configuración de Gmail SMTP (FALLBACK)
const GMAIL_USER = 'hdgomez0@gmail.com';
const GMAIL_PASS = 'wlstvjdckvhzxwvo';

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
 * Envía un correo electrónico usando Resend (PRINCIPAL) y Gmail SMTP (FALLBACK)
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
  console.log('📧 Iniciando envío de correo híbrido (Resend + Gmail) a:', to);
  console.log('📧 Asunto:', subject);
  console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
  
  // Intentar con Resend PRIMERO
  try {
    console.log('🔧 Probando Resend (PRINCIPAL)...');
    
    const mailData = {
      from: FROM_EMAIL,
      to: [to],
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
      
      mailData.attachments = [{
        filename: path.basename(attachmentPath),
        content: base64Content,
        type: 'application/pdf'
      }];
      
      console.log('📎 Archivo adjunto verificado:', attachmentPath);
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
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(responseData);
            resolve(response);
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
    
    console.log('✅ Correo enviado exitosamente con Resend a:', to);
    console.log('📧 Message ID:', result.id);
    return {
      messageId: result.id,
      accepted: [to],
      rejected: [],
      response: result,
      provider: 'Resend'
    };
    
  } catch (resendError) {
    console.error('❌ Error con Resend, intentando con Gmail SMTP (FALLBACK):', resendError.message);
    
    try {
      console.log('🔧 Probando Gmail SMTP (FALLBACK)...');
      
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
      
      console.log('✅ Correo enviado exitosamente con Gmail SMTP a:', to);
      console.log('📧 Message ID:', info.messageId);
      return {
        messageId: info.messageId,
        accepted: [to],
        rejected: [],
        response: info.response,
        provider: 'Gmail SMTP'
      };
      
    } catch (gmailError) {
      console.error('❌ Error con Gmail SMTP (FALLBACK):', gmailError.message);
      throw new Error(`Todos los métodos de envío fallaron. Resend: ${resendError.message}, Gmail: ${gmailError.message}`);
    }
  }
};

module.exports = { sendMail };
