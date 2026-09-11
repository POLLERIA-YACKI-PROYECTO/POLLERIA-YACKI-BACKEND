// src/routes/producto.routes.js
const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ✅ Importar correctamente el objeto con upload y handleMulterError
const { upload, handleMulterError } = require('../config/multer');

// ============================================
// ✅ RUTAS PÚBLICAS
// ============================================
router.get('/', productoController.getAll);
router.get('/disponibles', productoController.getDisponibles);
router.get('/categoria/:categoriaId', productoController.getByCategoria);
router.get('/:id', productoController.getById);

// ============================================
// RUTAS PROTEGIDAS - Solo Admin
// ============================================
router.post('/', 
  verifyToken, 
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.create
);

router.put('/:id', 
  verifyToken, 
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.update
);

//  Actualizar SOLO la imagen
router.patch('/:id/imagen',
  verifyToken,
  isAdmin,
  upload.single('imagen'),
  handleMulterError,
  productoController.updateImage
);
// Restaurar imagen por defecto
router.patch('/:id/restore-image',
  verifyToken,
  isAdmin,
  productoController.restoreDefaultImage
);

router.delete('/:id', verifyToken, isAdmin, productoController.delete);

module.exports = router;