const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Empleado = require('../models/Empleado'); // Modelo de empleado

const uploadPath = path.join(__dirname, '../uploads/cv/');

// Crear carpeta si no existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: async function (req, file, cb) {
        try {
            const { id } = req.params;
            const empleado = await Empleado.findByPk(id);

            if (!empleado) {
                return cb(new Error('Empleado no encontrado'));
            }

            const fileName = `${empleado.id}.pdf`;
            const filePath = path.join(uploadPath, fileName);

            // Si el archivo ya existe, lo eliminamos para sobrescribirlo
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            cb(null, fileName);
        } catch (error) {
            console.error('Error en filename:', error);
            cb(error);
        }
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
        return cb(new Error('El archivo debe ser un PDF'), false);
    }
    cb(null, true);
};

const uploadCV = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

module.exports = uploadCV;
