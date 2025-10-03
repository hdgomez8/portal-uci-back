# 🔧 GUÍA COMPLETA - SOLUCIÓN DE PROBLEMAS DE CORREOS
## Portal UCI - Sistema de Gestión de RRHH

---

## 📋 DIAGNÓSTICO INICIAL

### Problemas Identificados en tu Proyecto:

1. **❌ No existe archivo `.env`** - Las variables de entorno no están configuradas
2. **❌ Configuración TLS obsoleta** - En `utils/mailer.js` usa `SSLv3` (obsoleto)
3. **❌ Credenciales hardcodeadas** - Las credenciales están en el código fuente
4. **❌ Posibles problemas de autenticación Gmail** - Gmail requiere configuración especial

### Archivos Afectados:
- `utils/mailer.js` - Configuración principal de correos
- `mailer-alternativo.js` - Configuración alternativa (ya existe)
- Falta archivo `.env` para variables de entorno

---

## 🛠️ SOLUCIÓN PASO A PASO

### PASO 1: Crear Archivo de Variables de Entorno

**Crear archivo `.env` en la raíz del proyecto:**

```bash
# Configuración de Base de Datos
DB_HOST=127.0.0.1
DB_PORT=5555
DB_USERNAME=root
DB_PASSWORD=123456
DB_DATABASE=gestion_rrhh

# Configuración de Correos
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion

# Configuración del Servidor
PORT=5555
NODE_ENV=production

# JWT Secret
JWT_SECRET=tu-jwt-secret-muy-seguro
```

**⚠️ IMPORTANTE:** Reemplaza `tu-email@gmail.com` y `tu-contraseña-de-aplicacion` con tus credenciales reales.

---

### PASO 2: Configurar Gmail Correctamente

#### 2.1 Habilitar Verificación en 2 Pasos:
1. Ir a tu cuenta de Gmail
2. Configuración → Seguridad
3. Buscar "Verificación en 2 pasos"
4. Activar si no está activada

#### 2.2 Generar Contraseña de Aplicación:
1. En la misma sección de Seguridad
2. Buscar "Contraseñas de aplicaciones"
3. Seleccionar "Correo" y "Otro (nombre personalizado)"
4. Escribir "Portal UCI"
5. Copiar la contraseña generada (16 caracteres)
6. Usar esta contraseña en `EMAIL_PASS` del archivo `.env`

---

### PASO 3: Corregir Configuración TLS

**Editar archivo `utils/mailer.js`:**

**Buscar esta línea (línea 13):**
```javascript
ciphers: 'SSLv3'
```

**Cambiar por:**
```javascript
ciphers: 'TLSv1.2'
```

**El bloque completo debe quedar así:**
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'hdgomez0@gmail.com',
    pass: process.env.EMAIL_PASS || 'wlstvjdckvhzxwvo'
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'TLSv1.2'  // ✅ Cambiado de SSLv3
  }
});
```

---

### PASO 4: Crear Script de Prueba

**Crear archivo `test-email.js` en la raíz del proyecto:**

```javascript
require('dotenv').config();
const { sendMail } = require('./utils/mailer');

async function probarCorreos() {
  console.log('🚀 Iniciando prueba de envío de correos...\n');
  
  // Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO');
  console.log('');

  const emailPrueba = 'cuenta1uci2025@gmail.com';
  const asunto = 'Prueba de Correo - Portal UCI';
  const html = `
    <h2>🧪 Prueba de Correo</h2>
    <p>Este es un correo de prueba desde el Portal UCI.</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</p>
    <hr>
    <p><em>Si recibes este correo, la configuración está funcionando correctamente.</em></p>
  `;

  // Probar mailer principal
  console.log('📧 Probando mailer principal...');
  try {
    await sendMail(emailPrueba, asunto, html);
    console.log('✅ Mailer principal: FUNCIONANDO\n');
    console.log('🎉 ¡Los correos están funcionando correctamente!');
  } catch (error) {
    console.log('❌ Mailer principal: ERROR');
    console.log('   Error:', error.message);
    console.log('   Código:', error.code);
    console.log('');
    
    // Análisis de errores comunes
    if (error.code === 'EAUTH') {
      console.log('💡 SOLUCIÓN: Verificar credenciales o habilitar "Acceso de aplicaciones menos seguras"');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 SOLUCIÓN: Verificar conexión a internet o firewall');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 SOLUCIÓN: Timeout - verificar configuración de red');
    }
  }

  console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarCorreos().catch(console.error);
}

module.exports = { probarCorreos };
```

---

### PASO 5: Crear Script de Diagnóstico Avanzado

**Crear archivo `diagnostico-correos.js` en la raíz del proyecto:**

```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

async function diagnosticarCorreos() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE CORREOS - Portal UCI\n');
  console.log('=' .repeat(60));
  
  // 1. Verificar variables de entorno
  console.log('\n📋 1. VERIFICACIÓN DE VARIABLES DE ENTORNO:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n⚠️  PROBLEMA: Variables de entorno no configuradas');
    console.log('   Solución: Crear archivo .env con las credenciales correctas');
    return;
  }

  // 2. Probar diferentes configuraciones de Gmail
  console.log('\n📧 2. PROBANDO CONFIGURACIONES DE GMAIL:');
  
  const configuraciones = [
    {
      nombre: 'Configuración 1: SMTP TLS (Puerto 587)',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'TLSv1.2'
        }
      }
    },
    {
      nombre: 'Configuración 2: SMTP SSL (Puerto 465)',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    },
    {
      nombre: 'Configuración 3: Servicio Gmail',
      config: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    }
  ];

  let configuracionFuncionando = null;

  for (const config of configuraciones) {
    console.log(`\n   🔧 Probando: ${config.nombre}`);
    
    try {
      const transporter = nodemailer.createTransporter(config.config);
      
      // Verificar conexión
      console.log('      ⏳ Verificando conexión...');
      await transporter.verify();
      console.log('      ✅ Conexión exitosa');
      
      // Enviar correo de prueba
      console.log('      ⏳ Enviando correo de prueba...');
      const result = await transporter.sendMail({
        from: `Portal UCI <${process.env.EMAIL_USER}>`,
        to: 'cuenta1uci2025@gmail.com',
        subject: `Prueba ${config.nombre} - Portal UCI`,
        html: `
          <h2>🧪 Prueba de Correo</h2>
          <p>Esta es una prueba de la configuración: <strong>${config.nombre}</strong></p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <hr>
          <p><em>Si recibes este correo, la configuración está funcionando correctamente.</em></p>
        `
      });
      
      console.log('      ✅ Correo enviado exitosamente');
      console.log('      📧 Message ID:', result.messageId);
      console.log('      🎉 ¡ESTA CONFIGURACIÓN FUNCIONA!');
      
      configuracionFuncionando = config;
      break;
      
    } catch (error) {
      console.log('      ❌ Error:', error.message);
      console.log('      🔍 Código:', error.code);
      console.log('      📝 Tipo:', error.name);
      
      // Análisis de errores comunes
      if (error.code === 'EAUTH') {
        console.log('      💡 Posible solución: Verificar credenciales o habilitar "Acceso de aplicaciones menos seguras"');
      } else if (error.code === 'ECONNECTION') {
        console.log('      💡 Posible solución: Verificar conexión a internet o firewall');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('      💡 Posible solución: Timeout - verificar configuración de red');
      }
    }
  }

  // 3. Resumen y recomendaciones
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
  
  if (configuracionFuncionando) {
    console.log('✅ Estado: CORREOS FUNCIONANDO');
    console.log(`✅ Configuración recomendada: ${configuracionFuncionando.nombre}`);
    console.log('\n🔧 Para usar esta configuración en tu proyecto:');
    console.log('   1. Actualiza utils/mailer.js con la configuración que funcionó');
    console.log('   2. Reinicia tu servidor');
    console.log('   3. Los correos deberían enviarse correctamente');
  } else {
    console.log('❌ Estado: CORREOS NO FUNCIONAN');
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('   1. Verificar que las credenciales sean correctas');
    console.log('   2. Habilitar "Acceso de aplicaciones menos seguras" en Gmail');
    console.log('   3. Usar contraseña de aplicación específica de Gmail');
    console.log('   4. Verificar que el firewall no bloquee el puerto 587 o 465');
    console.log('   5. Considerar usar un servicio de correo alternativo (SendGrid, Mailgun, etc.)');
  }

  console.log('\n📝 PASOS PARA CONFIGURAR GMAIL:');
  console.log('   1. Ir a tu cuenta de Gmail');
  console.log('   2. Configuración > Seguridad');
  console.log('   3. Habilitar "Verificación en 2 pasos"');
  console.log('   4. Generar "Contraseña de aplicación"');
  console.log('   5. Usar esa contraseña en EMAIL_PASS');
  
  console.log('\n🏁 Diagnóstico completado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  diagnosticarCorreos().catch(console.error);
}

module.exports = { diagnosticarCorreos };
```

---

## 🧪 PRUEBAS A REALIZAR

### Prueba 1: Verificar Variables de Entorno
```bash
node -e "require('dotenv').config(); console.log('EMAIL_USER:', process.env.EMAIL_USER); console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'CONFIGURADO' : 'NO CONFIGURADO');"
```

### Prueba 2: Diagnóstico Completo
```bash
node diagnostico-correos.js
```

### Prueba 3: Prueba Simple
```bash
node test-email.js
```

### Prueba 4: Probar en la Aplicación
1. Crear una solicitud de vacaciones
2. Verificar que se envíe el correo de notificación
3. Revisar logs del servidor

---

## 🔍 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: `EAUTH`
**Causa:** Credenciales incorrectas o autenticación fallida
**Solución:**
- Verificar que EMAIL_USER sea correcto
- Usar contraseña de aplicación, no la contraseña normal
- Habilitar "Acceso de aplicaciones menos seguras"

### Error: `ECONNECTION`
**Causa:** Problemas de conectividad
**Solución:**
- Verificar conexión a internet
- Verificar que el firewall no bloquee puertos 587/465
- Probar desde otro servidor

### Error: `ETIMEDOUT`
**Causa:** Timeout de conexión
**Solución:**
- Verificar configuración de red
- Probar con diferentes puertos (587 vs 465)
- Verificar DNS

---

## 🚀 CONFIGURACIONES ALTERNATIVAS

### Opción 1: Gmail con OAuth2 (Recomendado para Producción)
```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  }
});
```

### Opción 2: SendGrid (Alternativa Profesional)
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Opción 3: Mailgun (Alternativa Profesional)
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_SMTP_USER,
    pass: process.env.MAILGUN_SMTP_PASS
  }
});
```

---

## 📊 MONITOREO EN PRODUCCIÓN

### Comandos para Verificar Logs
```bash
# Si usas PM2
pm2 logs

# Si usas systemd
journalctl -u tu-servicio -f

# Si usas Docker
docker logs -f nombre-contenedor
```

### Indicadores de Éxito
- ✅ "Correo enviado exitosamente" en logs
- ✅ Message ID generado
- ✅ Sin errores de autenticación

### Indicadores de Problema
- ❌ Error EAUTH
- ❌ Error ECONNECTION
- ❌ Timeout en envío
- ❌ Sin logs de envío

---

## 🔄 ROLLBACK SI ALGO SALE MAL

### Restaurar Configuración Original
```bash
git checkout utils/mailer.js
```

### Usar Mailer Alternativo Temporalmente
```javascript
// En lugar de sendMail, usar:
const { sendMailAlternativo } = require('./mailer-alternativo');
await sendMailAlternativo(to, subject, html, attachmentPath);
```

---

## 📞 SOPORTE ADICIONAL

Si los problemas persisten:
1. Revisar logs detallados del servidor
2. Probar con un servicio de correo diferente
3. Verificar configuración del servidor de producción
4. Considerar usar un servicio de correo transaccional profesional

---

## ✅ CHECKLIST FINAL

- [ ] Archivo `.env` creado con credenciales correctas
- [ ] Gmail configurado con verificación en 2 pasos
- [ ] Contraseña de aplicación generada y configurada
- [ ] `utils/mailer.js` actualizado con TLSv1.2
- [ ] Scripts de prueba creados
- [ ] Pruebas ejecutadas exitosamente
- [ ] Servidor reiniciado en producción
- [ ] Correos funcionando en la aplicación

---

**Nota:** Esta guía se basa en el análisis del código actual. Los problemas más comunes son la configuración de credenciales y la autenticación con Gmail. Sigue los pasos en orden y verifica cada uno antes de continuar al siguiente.

