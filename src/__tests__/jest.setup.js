// src/__tests__/jest.setup.js
// ============================================
// SETUP GLOBAL DE JEST (setupFiles)
// ============================================
// ⚠️ Este archivo se ejecuta ANTES del framework de testing.
// Solo puede usar jest.mock(), process.env, etc.
// NO puede usar afterEach, describe, it, expect.

// ✅ RUTA RELATIVA CORRECTA: desde src/__tests__/ hasta src/config/
jest.mock('../config/multer', () => {
  const multer = require('multer');
  const mockUpload = multer({ storage: multer.memoryStorage() });
  
  return {
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
});

jest.mock('../config/default-image', () => ({
  DEFAULT_IMAGE_NAME: 'imagen.jpg',
  DEFAULT_IMAGE_PATH: '/tmp/uploads/productos/imagen.jpg',
  getImageUrl: jest.fn((name) => `/uploads/productos/${name || 'imagen.jpg'}`),
  getImageName: jest.fn((name) => name || 'imagen.jpg'),
  isDefaultImage: jest.fn((name) => !name || name === 'imagen.jpg'),
  ensureDefaultImage: jest.fn()
}));

// ✅ Variables de entorno
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'polleria-yacky-secret-key-2026';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'polleria_yacki_test';