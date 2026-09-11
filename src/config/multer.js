// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  ensureDefaultImage
} = require('./default-image');

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const uploadDir = path.join(__dirname, '../../uploads/productos');

ensureDefaultImage();

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const identificador = crypto.randomBytes(8).toString('hex');
    const nombreArchivo = `producto-${Date.now()}-${identificador}${extension}`;

    callback(null, nombreArchivo);
  }
});

const tiposMimePermitidos = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);

const extensionesPermitidas = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp'
]);

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeValido = tiposMimePermitidos.has(file.mimetype);
  const extensionValida = extensionesPermitidas.has(extension);

  if (mimeValido && extensionValida) {
    callback(null, true);
    return;
  }

  callback(
    new Error('Solo se permiten imágenes JPG, JPEG, PNG, GIF o WEBP')
  );
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  },
  fileFilter
});

const handleMulterError = (error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'La imagen no debe superar los 20 MB'
      });
      return;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: 'Solo se permite una imagen por producto'
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
    return;
  }

  res.status(400).json({
    success: false,
    error: error.message || 'No se pudo procesar la imagen'
  });
};

module.exports = {
  upload,
  handleMulterError,
  uploadDir,
  MAX_IMAGE_SIZE
};