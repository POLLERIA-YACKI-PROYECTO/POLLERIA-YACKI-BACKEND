// src/routes/producto.routes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ✅ Importar correctamente el objeto con upload y handleMulterError
const { upload, handleMulterError } = require('../config/multer');

// ============================================
// ✅ RUTAS ESPECÍFICAS PRIMERO (sin parámetros)
// ============================================
router.get('/', productoController.getAll);
router.get('/disponibles', productoController.getDisponibles);
router.get('/categoria/:categoriaId', productoController.getByCategoria);

// ============================================
// ✅ RUTAS PROTEGIDAS — Admin
// ============================================

// Crear producto (con imagen)
router.post(
  '/',
  verifyToken,
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.create
);

// ✅ Actualizar SOLO la imagen — VA ANTES que PUT /:id
router.patch(
  '/:id/imagen',
  verifyToken,
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.updateImage
);

// ✅ Alias con PUT para compatibilidad
router.put(
  '/:id/imagen',
  verifyToken,
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.updateImage
);

// ✅ Toggle disponible/agotado — VA ANTES que PUT /:id
router.patch(
  '/:id/toggle',
  verifyToken,
  isAdmin,
  productoController.toggleDisponible
);

// ✅ Restaurar imagen por defecto — VA ANTES que PUT /:id
router.patch(
  '/:id/restore-image',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

// ✅ Alias con PUT para compatibilidad
router.put(
  '/:id/restore-image',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

// ✅ Actualizar producto completo (con o sin imagen)
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.update
);

// ✅ Eliminar producto
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  productoController.delete
);

// ============================================
// ⚠️ RUTAS CON PARÁMETRO AL FINAL (catch-all)
// ============================================
router.get('/:id', productoController.getById);

module.exports = router;