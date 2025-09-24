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

// Configurar multer
const upload = multer({ storage });

module.exports = upload;
