// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// ============================================
const uploadDir = path.join(__dirname, '../../uploads/productos');

// Crear el directorio si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[MULTER] Directorio de uploads creado:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `producto-${uniqueSuffix}${ext}`);
  }
});

// ============================================
// FILTRO DE ARCHIVOS (solo imágenes)
// ============================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  }

  cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
};

// ============================================
// INSTANCIA DE MULTER
// ============================================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  },
  fileFilter
});

// ============================================
// MANEJADOR DE ERRORES DE MULTER
// ============================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errores específicos de multer
    let mensaje = 'Error al subir el archivo';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        mensaje = 'El archivo excede el tamaño máximo permitido (5 MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        mensaje = 'Demasiados archivos subidos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        mensaje = `Campo de archivo inesperado: ${err.field}`;
        break;
      case 'LIMIT_PART_COUNT':
        mensaje = 'Demasiadas partes en el formulario';
        break;
      default:
        mensaje = err.message;
    }

    return res.status(400).json({
      success: false,
      error: mensaje,
      code: err.code
    });
  }

  if (err) {
    // Errores del fileFilter (tipo de archivo no permitido)
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al procesar el archivo'
    });
  }

  next();
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  upload,
  handleMulterError
};