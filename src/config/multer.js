// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// DIRECTORIOS
// ============================================
const uploadDirProductos = path.join(__dirname, '../../uploads/productos');
const uploadDirConfig = path.join(__dirname, '../../uploads/configuracion');

// Crear directorios si no existen
[uploadDirProductos, uploadDirConfig].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[MULTER] Directorio creado:', dir);
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
// STORAGE PRODUCTOS
// ============================================
const storageProductos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirProductos),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `producto-${uniqueSuffix}${ext}`);
  }
});

// ============================================
// STORAGE CONFIGURACIÓN (QRs, logos)
// ============================================
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirConfig),
  filename: (req, file, cb) => {
    const clave = String(req.body?.clave || 'config')
      .replace(/[^a-z0-9_-]/gi, '')
      .toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${clave}-${uniqueSuffix}${ext}`);
  }
});

// ============================================
// INSTANCIAS DE MULTER
// ============================================
const upload = multer({
  storage: storageProductos,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadConfig = multer({
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// ============================================
// MANEJADOR DE ERRORES DE MULTER
// ============================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
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
  uploadDir: uploadDirProductos,
  uploadDirConfig,
  upload,
  uploadConfig,
  handleMulterError
};