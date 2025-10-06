const nodemailer = require('nodemailer');
const { google } = require('googleapis');

/**
 * Envía un correo electrónico usando Gmail con credenciales de aplicación
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
        
        // Configurar Gmail con credenciales de aplicación
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hdgomez0@gmail.com',
                pass: 'wlstvjdckvhzxwvo' // Contraseña de aplicación
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        // Verificar conexión
        await transporter.verify();
        console.log('✅ Conexión Gmail verificada');
        
        const mailOptions = {
            from: 'Portal UCI <hdgomez0@gmail.com>',
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
        
        const info = await transporter.sendMail(mailOptions);
        
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
