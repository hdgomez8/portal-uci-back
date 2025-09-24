const nodemailer = require('nodemailer');

// Configuración 1: SMTP básico con TLS
const transporter1 = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'hdgomez0@gmail.com',
    pass: 'wlstvjdckvhzxwvo'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Configuración 2: SMTP con SSL
const transporter2 = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'hdgomez0@gmail.com',
    pass: 'wlstvjdckvhzxwvo'
  }
});

// Configuración 3: Usando servicio Gmail
const transporter3 = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'hdgomez0@gmail.com',
    pass: 'wlstvjdckvhzxwvo'
  }
});

// Función para probar diferentes configuraciones
const probarConfiguraciones = async () => {
  console.log('🚀 Probando diferentes configuraciones de Gmail...\n');
  
  const configuraciones = [
    { nombre: 'SMTP TLS (Puerto 587)', transporter: transporter1 },
    { nombre: 'SMTP SSL (Puerto 465)', transporter: transporter2 },
    { nombre: 'Servicio Gmail', transporter: transporter3 }
  ];
  
  for (const config of configuraciones) {
    console.log(`📧 Probando: ${config.nombre}`);
    
    try {
      // Verificar conexión
      await config.transporter.verify();
      console.log('  ✅ Conexión exitosa');
      
      // Enviar correo de prueba
      const result = await config.transporter.sendMail({
        from: 'hdgomez0@gmail.com',
        to: 'cuenta1uci2025@gmail.com',
        subject: `Prueba ${config.nombre} - Portal UCI`,
        html: `<p>Esta es una prueba de la configuración: <strong>${config.nombre}</strong></p>`
      });
      
      console.log('  ✅ Correo enviado exitosamente');
      console.log('  📧 Message ID:', result.messageId);
      console.log('  🎉 Esta configuración funciona!\n');
      
      // Si llegamos aquí, esta configuración funciona
      return config.transporter;
      
    } catch (error) {
      console.log('  ❌ Error:', error.message);
      console.log('  ❌ Código:', error.code);
      console.log('');
    }
  }
  
  console.log('❌ Ninguna configuración funcionó');
  return null;
};

// Función para enviar correo con la configuración que funcione
const sendMailAlternativo = async (to, subject, html, attachmentPath) => {
  try {
    console.log('📧 Iniciando envío de correo (método alternativo)...');
    
    // Probar configuraciones hasta encontrar una que funcione
    const transporter = await probarConfiguraciones();
    
    if (!transporter) {
      throw new Error('No se pudo establecer conexión con Gmail');
    }
    
    const mailOptions = {
      from: 'Portal UCI <hdgomez0@gmail.com>',
      to,
      subject,
      html
    };
    
    if (attachmentPath) {
      // Verificar que el archivo existe
      const fs = require('fs');
      if (!fs.existsSync(attachmentPath)) {
        throw new Error(`El archivo adjunto no existe: ${attachmentPath}`);
      }
      
      mailOptions.attachments = [
        {
          filename: attachmentPath.split('/').pop(),
          path: attachmentPath
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
    throw error;
  }
};

module.exports = { sendMailAlternativo }; 