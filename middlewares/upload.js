const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Empleado = require('../models/Empleado'); // Importamos el modelo de empleado

const uploadPath = path.join(__dirname, '../uploads/perfiles/');

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

            const extension = path.extname(file.originalname);
            const fileName = `${empleado.id}${extension}`;
            const filePath = path.join(uploadPath, fileName);

            // Si el archivo ya existe, lo eliminamos para sobrescribir
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
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('El archivo debe ser una imagen'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

module.exports = upload;
