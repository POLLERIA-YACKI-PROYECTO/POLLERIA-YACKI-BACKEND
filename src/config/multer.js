// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DEFAULT_IMAGE_NAME, ensureDefaultImage } = require('./default-image');

// Asegurar que la imagen por defecto existe
ensureDefaultImage();

const uploadDir = path.join(__dirname, '../../uploads/productos');

// Crear la carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Carpeta de imágenes creada:', uploadDir);
}

console.log('📁 Directorio de imágenes:', uploadDir);

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // ✅ Siempre se guarda como 'imagen.jpg'
    cb(null, DEFAULT_IMAGE_NAME);
  }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('❌ Solo se permiten imágenes (jpeg, jpg, png, gif, webp, svg)'));
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: fileFilter
});

// Middleware para manejar errores de Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
  uploadDir
};