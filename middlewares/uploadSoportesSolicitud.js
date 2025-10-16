const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'solicitudes'); // ruta absoluta
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // crea si no existe
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Middleware personalizado para normalizar la ruta del archivo
const normalizeFilePath = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      // Convertir ruta absoluta a relativa
      const relativePath = path.relative(path.join(__dirname, '..'), file.path);
      file.path = relativePath; // Sobrescribir con ruta relativa
    });
  }
  next();
};

// Configurar multer con límites y validaciones
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: PDF, JPG, PNG, GIF, DOC, DOCX`), false);
    }
  }
});

module.exports = { upload, normalizeFilePath };
