# Análisis de Timeout en Creación de Solicitudes

## Problema Identificado
El frontend está experimentando errores de timeout (`ECONNABORTED`) al crear solicitudes, con un timeout configurado de 60 segundos.

## Análisis del Código

### 1. Controlador de Solicitudes (`crearSolicitud`)
**Ubicación**: `controllers/Solicitudes/solicitudController.js` (líneas 94-216)

**Problemas identificados**:

#### A. Consultas de Base de Datos Complejas
- **Líneas 115-130**: Consulta compleja con múltiples `include` para verificar roles del empleado
- **Líneas 174-185**: Consulta con asociaciones anidadas para encontrar el jefe del área
- **Líneas 188-205**: Proceso de envío de correo que puede ser lento

#### B. Procesamiento Síncrono de Archivos
- **Líneas 160-171**: Procesamiento de archivos adjuntos de forma síncrona
- **Líneas 192-201**: Generación y envío de correo síncrono

#### C. Transacciones Largas
- La transacción se mantiene abierta durante todo el proceso (líneas 95-207)
- Incluye operaciones que no requieren transacción (envío de correo)

### 2. Middleware de Upload
**Ubicación**: `middlewares/uploadSoportesSolicitud.js`

**Problemas**:
- No hay límite de tamaño de archivo configurado
- No hay validación de tipos de archivo
- Procesamiento síncrono de archivos

### 3. Configuración de Base de Datos
**Ubicación**: `config/database.js`

**Problemas**:
- No hay configuración de pool de conexiones
- No hay configuración de timeout de consultas
- Logging deshabilitado (dificulta debugging)

## Soluciones Propuestas

### 1. Optimización Inmediata (Crítico)

#### A. Separar Envío de Correo de la Transacción
```javascript
// Mover el envío de correo fuera de la transacción
await t.commit();
// Enviar correo después de confirmar la transacción
if (jefe) {
  // Proceso de envío de correo (asíncrono)
}
```

#### B. Optimizar Consultas de Base de Datos
```javascript
// Simplificar consulta de verificación de roles
const empleadoVerificacion = await Empleado.findByPk(empleado_id, {
  attributes: ['id'],
  include: [{
    model: Usuario,
    as: 'usuario',
    attributes: ['id'],
    include: [{
      model: Rol,
      as: 'roles',
      attributes: ['nombre'],
      where: { nombre: 'JEFE AREA' }
    }]
  }]
});
```

#### C. Configurar Pool de Conexiones
```javascript
const db = new Sequelize(/* ... */, {
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log // Habilitar para debugging
});
```

### 2. Optimización de Rendimiento (Importante)

#### A. Procesamiento Asíncrono de Archivos
```javascript
// Procesar archivos en paralelo
const adjuntosPromises = req.files.map(file => 
  AdjuntoSolicitud.create({
    solicitud_id: nuevaSolicitud.id,
    ruta_archivo: file.path,
    nombre_archivo: file.originalname,
    tipo_mime: file.mimetype,
    tamaño: file.size
  }, { transaction: t })
);
await Promise.all(adjuntosPromises);
```

#### B. Envío de Correo Asíncrono
```javascript
// Enviar correo sin bloquear la respuesta
setImmediate(async () => {
  try {
    await sendMail(/* ... */);
  } catch (error) {
    console.error('Error enviando correo:', error);
  }
});
```

### 3. Mejoras de Configuración (Recomendado)

#### A. Configurar Multer con Límites
```javascript
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});
```

#### B. Añadir Timeout al Servidor
```javascript
// En server.js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Timeout para requests largos
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 minutos
  res.setTimeout(120000);
  next();
});
```

## Plan de Implementación

### ✅ Fase 1: Correcciones Críticas (COMPLETADA)
1. ✅ Mover envío de correo fuera de la transacción
2. ✅ Optimizar consulta de verificación de roles
3. ✅ Configurar pool de conexiones de base de datos

### ✅ Fase 2: Optimizaciones de Rendimiento (COMPLETADA)
1. ✅ Implementar procesamiento asíncrono de archivos
2. ✅ Hacer envío de correo asíncrono
3. ✅ Añadir límites a multer

### ✅ Fase 3: Mejoras de Configuración (COMPLETADA)
1. ✅ Configurar timeouts del servidor
2. ✅ Implementar logging detallado
3. ✅ Añadir métricas de rendimiento

## Archivos Modificados

1. ✅ `controllers/Solicitudes/solicitudController.js` - Optimizado `crearSolicitud`
2. ✅ `config/database.js` - Añadida configuración de pool
3. ✅ `middlewares/uploadSoportesSolicitud.js` - Añadidos límites y validaciones
4. ✅ `server.js` - Configurados timeouts y límites

## Cambios Implementados

### 1. Controlador de Solicitudes (`solicitudController.js`)
- **Envío de correo asíncrono**: Movido fuera de la transacción usando `setImmediate()`
- **Respuesta inmediata**: El cliente recibe respuesta antes del envío de correo
- **Consulta optimizada**: Verificación de roles más eficiente con `where` clause
- **Manejo de errores**: Errores de correo no afectan la respuesta al cliente

### 2. Configuración de Base de Datos (`database.js`)
- **Pool de conexiones**: Configurado con máximo 10 conexiones
- **Timeouts**: 30 segundos para adquirir conexión, 10 segundos idle
- **Logging**: Habilitado para debugging
- **Configuración adicional**: Timestamps y freezeTableName

### 3. Middleware de Upload (`uploadSoportesSolicitud.js`)
- **Límites de archivo**: 5MB máximo por archivo, máximo 5 archivos
- **Validación de tipos**: Solo PDF, JPG, PNG, GIF, DOC, DOCX
- **Mensajes de error**: Informativos para tipos no permitidos

### 4. Servidor (`server.js`)
- **Límites de payload**: 10MB para JSON y URL-encoded
- **Timeout de requests**: 2 minutos para requests largos
- **Manejo de timeout**: Respuesta 408 con mensaje informativo
- **Logging mejorado**: Incluye timestamp y método HTTP

## Monitoreo

Después de implementar las correcciones, monitorear:
- Tiempo de respuesta de creación de solicitudes
- Errores de timeout
- Uso de memoria y CPU
- Logs de base de datos

## Notas Adicionales

- El problema principal es que el envío de correo está bloqueando la respuesta
- Las consultas de base de datos son innecesariamente complejas
- No hay manejo de errores específico para timeouts
- La configuración de base de datos es muy básica

## Resultados Esperados

Después de estas correcciones, se espera:
- **Tiempo de respuesta**: Reducción de 60+ segundos a < 5 segundos
- **Eliminación de timeouts**: No más errores `ECONNABORTED`
- **Mejor experiencia de usuario**: Respuesta inmediata al crear solicitudes
- **Correos asíncronos**: Se envían en segundo plano sin bloquear la respuesta
- **Mejor rendimiento**: Pool de conexiones y consultas optimizadas

## Próximos Pasos

1. **Reiniciar el servidor** para aplicar los cambios
2. **Probar creación de solicitudes** desde el frontend
3. **Monitorear logs** para verificar que no hay errores
4. **Verificar envío de correos** (deben llegar en segundo plano)

---
*Documento creado: $(date)*
*Estado: ✅ CORRECCIONES IMPLEMENTADAS - Listo para pruebas*
