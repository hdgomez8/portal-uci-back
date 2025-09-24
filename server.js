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
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Log global de todas las peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/firmas", express.static(path.join(__dirname, "firmas")));

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
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});