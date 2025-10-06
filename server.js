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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/firmas", express.static(path.join(__dirname, "firmas")));
app.use("/public", express.static(path.join(__dirname, "public")));

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
  
  // Ejecutar diagnóstico de Gmail API al iniciar
  console.log('🔍 INICIANDO DIAGNÓSTICO DE GMAIL API...');
  console.log('==========================================');
  
  // Ejecutar en segundo plano para no bloquear el inicio del servidor
  setImmediate(async () => {
    try {
      console.log('🔧 Cargando módulo mailer...');
      const { sendMail } = require('./utils/mailer');
      console.log('✅ Módulo mailer cargado correctamente');
      
      console.log('🔧 Verificando variables de entorno...');
      const variables = {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN
      };
      
      const variablesConfiguradas = Object.values(variables).filter(v => v).length;
      console.log(`📊 Variables configuradas: ${variablesConfiguradas}/4`);
      
      if (variablesConfiguradas < 4) {
        console.log('❌ Variables de entorno incompletas:');
        Object.entries(variables).forEach(([key, value]) => {
          const status = value ? '✅' : '❌';
          console.log(`   ${status} ${key}: ${value ? 'CONFIGURADA' : 'FALTANTE'}`);
        });
        return;
      }
      
      console.log('✅ Variables de entorno configuradas correctamente');
      console.log('🔧 Iniciando envío de correo de prueba...');
      
      // Test de Gmail API
      const resultado = await sendMail(
        'hdgomez0@gmail.com',
        '🔍 Diagnóstico Gmail API - Inicio del Servidor',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">🔍 Diagnóstico Gmail API - Inicio del Servidor</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Información del Servidor</h3>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Servidor:</strong> ${process.env.HOSTNAME || 'Portal UCI'}</p>
              <p><strong>Sistema:</strong> ${process.platform} ${process.arch}</p>
              <p><strong>Node.js:</strong> ${process.version}</p>
              <p><strong>Método:</strong> Gmail API (OAuth 2.0)</p>
              <p><strong>Puerto:</strong> HTTPS (443)</p>
            </div>
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;"><strong>✅ Gmail API funcionando correctamente</strong></p>
              <p style="margin: 5px 0 0 0; color: #155724;">El sistema de correos con Gmail API está operativo.</p>
            </div>
          </div>
        `
      );
      
      console.log('🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
      console.log('======================================');
      console.log('✅ Gmail API funcionando correctamente');
      console.log('📧 Message ID:', resultado.messageId);
      console.log('📧 Provider:', resultado.provider);
      console.log('📧 Destinatario: hdgomez0@gmail.com');
      console.log('======================================');
      
    } catch (error) {
      console.log('❌ ERROR EN DIAGNÓSTICO DE GMAIL API');
      console.log('=====================================');
      console.error('❌ Error:', error.message);
      console.log('🔍 Stack trace:', error.stack);
      console.log('💡 Verificar variables de entorno en .env');
      console.log('💡 Verificar conectividad a internet');
      console.log('💡 Verificar credenciales de Google Cloud Console');
      console.log('=====================================');
    }
  });
});