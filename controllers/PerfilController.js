const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Usuario, Empleado } = require('../models');
const { verificarToken } = require('../middlewares/authMiddleware');

// Asegurar que el directorio de firmas existe
const firmasDir = path.join(__dirname, '..', 'firmas');
if (!fs.existsSync(firmasDir)) {
  fs.mkdirSync(firmasDir, { recursive: true });
}

const upload = multer({ dest: firmasDir });

// Obtener perfil
router.get('/mi-perfil', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const usuario = await Usuario.findByPk(usuarioId, {
    include: [{ model: Empleado, as: 'empleado' }]
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

// Actualizar perfil
router.put('/mi-perfil', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const { email, telefono, direccion } = req.body;
  const usuario = await Usuario.findByPk(usuarioId, {
    include: [{ model: Empleado, as: 'empleado' }]
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (email) usuario.email = email;
  if (usuario.empleado) {
    if (telefono) usuario.empleado.telefono = telefono;
    if (direccion) usuario.empleado.direccion = direccion;
    await usuario.empleado.save();
  }
  await usuario.save();
  res.json({ message: 'Perfil actualizado correctamente' });
});

// Subir/cambiar firma
router.post('/mi-perfil/firma', verificarToken, upload.single('firma'), async (req, res) => {
  const usuarioId = req.usuario.id;
  const usuario = await Usuario.findByPk(usuarioId, {
    include: [{ model: Empleado, as: 'empleado' }]
  });
  if (!usuario || !usuario.empleado) return res.status(404).json({ error: 'Usuario no encontrado' });
  const dni = usuario.empleado.documento;
  const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
  const newPath = path.join(firmasDir, `${dni}${ext}`);
  fs.renameSync(req.file.path, newPath);
  const firmaUrl = `/firmas/${dni}${ext}`;
  res.json({ message: 'Firma actualizada correctamente', firma: firmaUrl });
});

// Obtener firma actual
router.get('/mi-perfil/firma', verificarToken, async (req, res) => {
  const usuarioId = req.usuario.id;
  const usuario = await Usuario.findByPk(usuarioId, {
    include: [{ model: Empleado, as: 'empleado' }]
  });
  
  if (!usuario || !usuario.empleado) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const dni = usuario.empleado.documento;
  const extensions = ['.png', '.jpg', '.jpeg', '.gif'];
  let firmaUrl = null;

  // Buscar si existe una firma para este usuario
  for (const ext of extensions) {
    const firmaPath = path.join(firmasDir, `${dni}${ext}`);
    if (fs.existsSync(firmaPath)) {
      firmaUrl = `/firmas/${dni}${ext}`;
      break;
    }
  }

  res.json({ firma: firmaUrl });
});

module.exports = router; 