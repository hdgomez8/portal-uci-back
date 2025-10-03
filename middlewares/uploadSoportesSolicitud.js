const multer = require('multer');
const path = require('path');

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/solicitudes/'); // Carpeta donde se guardan los archivos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Renombrar archivos con timestamp
    }
});

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

module.exports = upload;
