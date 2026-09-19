// src/__tests__/jest.setup.js
// ============================================
// SETUP GLOBAL DE JEST (setupFiles)
// ============================================

// --------------------------------------------
// MOCK DEL PAQUETE NPM `multer` (para pedidoCliente.routes.js)
// --------------------------------------------
jest.mock('multer', () => {
  const mockStorage = {
    _handleFile: (req, file, cb) => cb(null, { path: '/tmp/mock', filename: 'mock.jpg' }),
    _removeFile: (req, file, cb) => cb(null)
  };

  const multer = () => ({
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next(),
    none: () => (req, res, next) => next(),
    any: () => (req, res, next) => next()
  });

  multer.diskStorage = () => mockStorage;
  multer.memoryStorage = () => mockStorage;

  return multer;
});

// --------------------------------------------
// MOCK DE CONFIG/MULTER (módulo propio)
// --------------------------------------------
jest.mock('../config/multer', () => {
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

  return {
    upload: mockUpload,
    uploadConfig: mockUpload,
    handleMulterError,
    uploadDir: '/tmp/uploads',
    uploadDirConfig: '/tmp/uploads',
    MAX_IMAGE_SIZE: 20 * 1024 * 1024
  };
});

// --------------------------------------------
// MOCK DE CONFIG/DEFAULT-IMAGE
// --------------------------------------------
jest.mock('../config/default-image', () => ({
  DEFAULT_IMAGE_NAME: 'imagen.jpg',
  DEFAULT_IMAGE_PATH: '/tmp/uploads/productos/imagen.jpg',
  UPLOADS_DIR: '/tmp/uploads/productos',
  getImageUrl: (name) => `/uploads/productos/${name || 'imagen.jpg'}`,
  getImageName: (name) => name || 'imagen.jpg',
  isDefaultImage: (name) => !name || name === 'imagen.jpg',
  ensureDefaultImage: () => {}
}));

// --------------------------------------------
// MOCK DE CONFIG/DATABASE
// --------------------------------------------
jest.mock('../config/database', () => {
  const query = jest.fn().mockResolvedValue([[], []]);
  const execute = jest.fn().mockResolvedValue([[], []]);
  const getConnection = jest.fn();
  const end = jest.fn().mockResolvedValue();
  const on = jest.fn();

  return {
    query,
    execute,
    getConnection,
    end,
    on,
    pool: {
      _allConnections: [],
      _freeConnections: [],
      _connectionQueue: []
    }
  };
});

// --------------------------------------------
// MOCK DE SERVICES/EMAIL.SERVICE
// --------------------------------------------
jest.mock('../services/email.service', () => ({
  enviarCodigoVerificacion: jest.fn().mockResolvedValue({ messageId: 'test-id' })
}));

// --------------------------------------------
// MOCKS GLOBALES DE MODELOS
// --------------------------------------------
jest.mock('../models/Usuario');
jest.mock('../models/Cliente');
jest.mock('../models/Configuracion');
jest.mock('../models/Categoria');
jest.mock('../models/Producto');
jest.mock('../models/Venta');
jest.mock('../models/Pedido');
jest.mock('../models/Mesa');
jest.mock('../models/HistorialActividad');

// --------------------------------------------
// VARIABLES DE ENTORNO
// --------------------------------------------
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'polleria-yacky-secret-key-2026';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'polleria_yacki_test';
process.env.EMAIL_HOST = 'smtp.test.local';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.local';
process.env.EMAIL_PASS = 'test-pass';
process.env.EMAIL_FROM = 'test@test.local';