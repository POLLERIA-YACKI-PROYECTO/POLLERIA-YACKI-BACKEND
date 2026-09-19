// src/__tests__/__mocks__/multer.js
// Mock que se aplica vía moduleNameMapper a cualquier require de config/multer
const handleMulterError = (error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al procesar archivo'
    });
  }
  next();
};

const mockUpload = {
  single: () => (req, res, next) => next(),
  array: () => (req, res, next) => next(),
  fields: () => (req, res, next) => next(),
  none: () => (req, res, next) => next(),
  any: () => (req, res, next) => next()
};

module.exports = {
  upload: mockUpload,
  uploadConfig: mockUpload,
  handleMulterError,
  uploadDir: '/tmp/uploads',
  uploadDirConfig: '/tmp/uploads',
  MAX_IMAGE_SIZE: 20 * 1024 * 1024
};