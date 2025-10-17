require('dotenv').config();
const { Empleado, Usuario, Rol, Permiso } = require('./models');
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const rolRoutes = require('./routes/rolRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const departamentoRoutes = require('./routes/EstructuraEmpresa/departamentoRoutes');
const areaRoutes = require('./routes/EstructuraEmpresa/areaRoutes');
const solicitudesRoutes = require('./routes/Solicitudes/solicitudesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const perfilRoutes = require('./routes/perfil');
const cambioTurnoRoutes = require('./routes/cambioTurnoRoutes');
const cesantiasRoutes = require('./routes/cesantiasRoutes');
const vacacionesRoutes = require('./routes/vacacionesRoutes');
const tipoSolicitudRoutes = require('./routes/tipoSolicitudRoutes');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite de 10MB para JSON
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Límite de 10MB para URL-encoded

// Log global de todas las peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware de timeout para requests largos
app.use((req, res, next) => {
  // Configurar timeout de 2 minutos para requests largos
  req.setTimeout(120000); // 2 minutos
  res.setTimeout(120000); // 2 minutos
  
  // Manejar timeout
  req.on('timeout', () => {
    console.error(`⏰ Timeout en request: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(408).json({ 
        error: 'Request timeout', 
        message: 'La solicitud tardó demasiado en procesarse' 
      });
    }
  });
  
  next();
});
// Servir archivos estáticos de uploads sin autenticación
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    // Asegurar que los archivos se sirvan con los headers correctos
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}));
// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/cambio-turno', cambioTurnoRoutes);
app.use('/api/cesantias', cesantiasRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/tipos-solicitud', tipoSolicitudRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);

app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/firmas", express.static(path.join(__dirname, "firmas")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Ruta específica para servir archivos adjuntos sin autenticación
app.get('/uploads/solicitudes/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'solicitudes', filename);
  
  console.log(`📁 Sirviendo archivo adjunto: ${filePath}`);
  
  // Verificar que el archivo existe
  if (!require('fs').existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  
  // Servir el archivo con headers apropiados
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.sendFile(filePath);
});

// Ruta alternativa para servir archivos adjuntos (sin /uploads en la URL)
app.get('/api/files/solicitudes/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'solicitudes', filename);
  
  console.log(`📁 Sirviendo archivo adjunto via API: ${filePath}`);
  
  // Verificar que el archivo existe
  if (!require('fs').existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  
  // Servir el archivo con headers apropiados
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.sendFile(filePath);
});

// Sincronizar la base de datos
(async () => {
  try {
    await db.sync();
    console.log('Base de datos sincronizada');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
})();

const PORT = process.env.PORT || 5555;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  
  // Gmail API configurado y listo para usar
  console.log('📧 Gmail API configurado y listo para envío de correos');
});