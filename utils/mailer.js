const https = require('https');
require('dotenv').config();

// Configuración de Resend desde variables de entorno
const RESEND_API_KEY = 're_jQYP7ZXu_GRSKEouf8kMtvgNvYMj47A9D';
const FROM_EMAIL = 'Portal UCI <noreply@resend.dev>';

/**
 * Envía un correo electrónico usando Resend
 * @param {string} to - Correo destinatario
 * @param {string} subject - Asunto
 * @param {string} html - Cuerpo HTML
 * @param {string} [attachmentPath] - Ruta absoluta del archivo a adjuntar (opcional)
 */
const sendMail = async (to, subject, html, attachmentPath) => {
  try {
    console.log('📧 Iniciando envío de correo con Resend a:', to);
    console.log('📧 Asunto:', subject);
    console.log('📧 Adjunto:', attachmentPath || 'Ninguno');
    
    // Crear el objeto de datos para Resend
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
      
      // Leer el archivo como base64
      const fileBuffer = fs.readFileSync(attachmentPath);
      const base64Content = fileBuffer.toString('base64');
      
      mailData.attachments = [{
        filename: path.basename(attachmentPath),
        content: base64Content,
        type: 'application/pdf',
        disposition: 'attachment'
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
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(responseData);
            console.log('✅ Correo enviado exitosamente con Resend a:', to);
            console.log('📧 Message ID:', response.id);
            resolve({
              messageId: response.id,
              accepted: [to],
              rejected: [],
              response: response
            });
          } else {
            console.error('❌ Error de Resend:', res.statusCode);
            console.error('📧 Respuesta:', responseData);
            reject(new Error(`Resend Error: ${res.statusCode} - ${responseData}`));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Error de conexión:', error.message);
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
    
  } catch (error) {
    console.error('❌ Error enviando correo con Resend:', error);
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