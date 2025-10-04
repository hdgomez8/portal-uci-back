# Scripts de Verificación de Configuración

## 📋 Descripción

Estos scripts permiten verificar que la configuración de correos del Portal UCI está funcionando correctamente.

## 🚀 Scripts Disponibles

### 1. `verificacion-inicio.js`
**Propósito**: Se ejecuta automáticamente al iniciar la aplicación
**Ubicación**: `scripts/verificacion-inicio.js`
**Funcionamiento**: 
- Se ejecuta automáticamente cuando se inicia el servidor
- Envía un correo de verificación con la configuración actual
- Incluye información del sistema y estado de archivos

### 2. `test-configuracion.js`
**Propósito**: Script manual para verificar configuración
**Ubicación**: `scripts/test-configuracion.js`
**Uso**: 
```bash
node scripts/test-configuracion.js
```

## 📧 Correos de Verificación

### Correo de Éxito
Cuando la configuración funciona correctamente, recibirás un correo con:
- ✅ Estado de configuración
- 🖥️ Información del sistema
- 📧 Configuración de correos
- 📁 Estado de archivos
- 🔒 Mejoras de seguridad implementadas

### Correo de Error
Si hay problemas, recibirás un correo con:
- ❌ Detalles del error
- 📋 Stack trace completo
- 🖥️ Información del sistema
- 🔍 Instrucciones para diagnóstico

## 🔧 Configuración Requerida

### Variables de Entorno
```bash
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

### Archivos Requeridos
- `utils/mailer.js` - Configuración de correos
- `utils/emailTemplates.js` - Plantillas de correo
- `config/database.js` - Configuración de base de datos
- `server.js` - Servidor principal

## 🚀 Uso en Producción

### Verificación Automática
1. **Reiniciar la aplicación** en producción
2. **Revisar logs** del servidor para confirmar ejecución
3. **Verificar correo** de verificación en la bandeja de entrada
4. **Confirmar configuración** según el contenido del correo

### Verificación Manual
```bash
# En el servidor de producción
cd /ruta/del/proyecto
node scripts/test-configuracion.js
```

## 📊 Información Incluida en el Correo

### Sistema
- Hostname del servidor
- Plataforma y arquitectura
- Versión de Node.js
- Memoria total y libre
- Timestamp de verificación

### Configuración de Correos
- Servidor SMTP (smtp.gmail.com:587)
- Usuario configurado
- Estado de contraseña (oculta por seguridad)
- Protocolo TLS (TLSv1.2+)
- Cifrados implementados

### Archivos de Configuración
- Estado de cada archivo requerido
- Verificación de existencia
- Indicadores visuales de estado

### Seguridad
- SSLv3 eliminado
- TLSv1.2+ configurado
- Cifrados modernos implementados
- Timeouts configurados
- Envío asíncrono activo

## 🔍 Diagnóstico de Problemas

### Si no recibes el correo
1. **Verificar variables de entorno**:
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASS
   ```

2. **Revisar logs del servidor**:
   ```bash
   tail -f logs/app.log | grep -E "(📧|✅|❌|🔍)"
   ```

3. **Ejecutar verificación manual**:
   ```bash
   node scripts/test-configuracion.js
   ```

4. **Verificar conectividad SMTP**:
   ```bash
   telnet smtp.gmail.com 587
   ```

### Si el correo llega con errores
1. **Revisar configuración TLS** en el correo
2. **Verificar archivos faltantes** según el reporte
3. **Comprobar permisos** de archivos
4. **Revisar logs** para errores específicos

## 📝 Logs Esperados

### Al Iniciar la Aplicación
```
Servidor corriendo en el puerto 5555
🔍 Ejecutando verificación de configuración de correos...
🔍 Iniciando verificación de configuración de correos...
✅ Correo de verificación enviado exitosamente
📧 Configuración verificada y reportada
✅ Verificación de configuración completada
```

### Al Ejecutar Manualmente
```
🚀 Iniciando verificación manual de configuración de correos...
📧 Este script enviará un correo de verificación a la dirección configurada
⏳ Ejecutando verificación...

🔍 Iniciando verificación de configuración de correos...
✅ Correo de verificación enviado exitosamente
📧 Configuración verificada y reportada

✅ Verificación completada exitosamente
📧 Revisa tu correo para confirmar que la configuración funciona
```

## 🎯 Beneficios

- **Verificación automática** al iniciar la aplicación
- **Diagnóstico completo** de la configuración
- **Reporte detallado** por correo
- **Información del sistema** para debugging
- **Detección temprana** de problemas
- **Confirmación visual** de que todo funciona

---
*Documento creado: $(date)*
*Estado: ✅ LISTO PARA USO EN PRODUCCIÓN*
