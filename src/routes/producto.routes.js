// src/routes/producto.routes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Importación 100% defensiva
const multerConfig = require('../config/multer') || {};

const uploadSingle = (field) => {
  if (multerConfig.upload && typeof multerConfig.upload.single === 'function') {
    return multerConfig.upload.single(field);
  }
  // Middleware noop si upload no está disponible
  return function uploadNoop(req, res, next) { next(); };
};

const handleMulterError =
  typeof multerConfig.handleMulterError === 'function'
    ? multerConfig.handleMulterError
    : function handleMulterErrorNoop(err, req, res, next) { next(); };

// ============================================
//  RUTAS ESPECÍFICAS PRIMERO (sin parámetros)
// ============================================
router.get('/', productoController.getAll);
router.get('/disponibles', productoController.getDisponibles);
router.get('/categoria/:categoriaId', productoController.getByCategoria);

// ============================================
//  RUTAS PROTEGIDAS — Admin
// ============================================

router.post(
  '/',
  verifyToken,
  isAdmin,
  uploadSingle('imagen'),
  handleMulterError,
  productoController.create
);

router.patch(
  '/:id/imagen',
  verifyToken,
  isAdmin,
  uploadSingle('imagen'),
  handleMulterError,
  productoController.updateImage
);

router.put(
  '/:id/imagen',
  verifyToken,
  isAdmin,
  uploadSingle('imagen'),
  handleMulterError,
  productoController.updateImage
);

router.patch(
  '/:id/toggle',
  verifyToken,
  isAdmin,
  productoController.toggleDisponible
);

router.patch(
  '/:id/restore-image',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

router.put(
  '/:id/restore-image',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

router.post(
  '/:id/restaurar-imagen',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

router.put(
  '/:id',
  verifyToken,
  isAdmin,
  uploadSingle('imagen'),
  handleMulterError,
  productoController.update
);

router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  productoController.delete
);

router.get('/:id', productoController.getById);

module.exports = router;