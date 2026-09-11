// src/__mocks__/multer.js
// Mock global de multer para tests
const multer = require('multer');

const mockUpload = multer({ storage: multer.memoryStorage() });

module.exports = {
  upload: mockUpload,
  handleMulterError: (error, req, res, next) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al procesar archivo'
      });
    }
    next();
  },
  uploadDir: '/tmp/uploads',
  MAX_IMAGE_SIZE: 20 * 1024 * 1024
};