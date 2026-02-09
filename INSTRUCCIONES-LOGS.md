# 📋 Cómo Ver los Logs del Servidor

## 🚀 Opción 1: Ejecutar en Modo Desarrollo (Recomendado)

Abre una **nueva terminal** y ejecuta:

```powershell
cd "d:\PortalUci\back rrhh"
npm run dev
```

Esto iniciará el servidor con `nodemon` y verás **todos los logs en tiempo real** en esa terminal.

Cuando intentes descargar un archivo, verás logs detallados como:

```
[2026-02-09T...] GET /api/vacaciones/46/descargar-pdf
🔍 Análisis del archivo:
  📁 Ruta: pdfs/vacaciones_46_1756225660158.pdf
  📄 Extensión: .pdf
  🔢 Magic numbers: 0x25 0x50 0x44 0x46
  ✅ Es PDF: true
  ✅ Es XLSX: false
📤 Archivo final a enviar: pdfs/vacaciones_46_1756225660158.pdf
📤 Ruta absoluta: D:\PortalUci\back rrhh\pdfs\vacaciones_46_1756225660158.pdf
📤 Nombre archivo: formato_vacaciones_46.pdf
📤 Content-Type: application/pdf
📊 Tamaño final: 12345 bytes
✅ Archivo enviado exitosamente
```

## 🔍 Opción 2: Si el Servidor Está en Producción

Si el servidor está corriendo en un servidor remoto (producción), necesitas:

1. **Conectarte al servidor** (SSH, RDP, etc.)
2. **Encontrar dónde está corriendo el servidor**:
   - Si usa PM2: `pm2 logs api`
   - Si usa systemd: `journalctl -u nombre-servicio -f`
   - Si corre directamente: buscar la terminal donde se ejecutó

## 📝 Qué Buscar en los Logs

Cuando intentes descargar un archivo, busca estos mensajes:

- `🔍 Análisis del archivo:` - Inicio del análisis
- `📁 Ruta:` - Ruta del archivo encontrado
- `🔢 Magic numbers:` - Detección del tipo real del archivo
- `✅ Es PDF:` / `✅ Es XLSX:` - Tipo detectado
- `📤 Archivo final a enviar:` - Archivo que se enviará
- `✅ Archivo enviado exitosamente` - Descarga exitosa
- `❌ ERROR:` - Si hay algún error

## 🐛 Si Hay Errores

Si ves errores como:
- `❌ ERROR: El archivo no existe`
- `❌ ERROR: El archivo está vacío`
- `❌ Error al enviar archivo`

Copia el mensaje completo y compártelo para diagnosticar el problema.

## 💡 Tip

Para ver solo los logs relacionados con descargas de archivos, puedes filtrar:

```powershell
# En PowerShell (si usas nodemon)
npm run dev | Select-String -Pattern "descargar|PDF|XLSX|archivo|Magic"
```
