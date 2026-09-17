// src/routes/configuracion.routes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracion.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { uploadConfig, handleMulterError } = require('../config/multer');

// ============================================
// RUTAS PÚBLICAS (sin token)
// ============================================
router.get('/publicas', configController.getPublicas);

// ============================================
// RUTAS PROTEGIDAS (solo admin)
// ============================================
router.get('/', verifyToken, isAdmin, configController.getAll);
router.put('/', verifyToken, isAdmin, configController.update);
router.post('/', verifyToken, isAdmin, configController.create);

//  Subir imagen (QR)
router.post(
  '/imagen',
  verifyToken,
  isAdmin,
  uploadConfig.single('imagen'),
  handleMulterError,
  configController.subirImagen
);

//  Eliminar imagen
router.delete(
  '/imagen/:clave',
  verifyToken,
  isAdmin,
  configController.eliminarImagen
);

//  Rutas con parámetro AL FINAL
router.get('/:clave', verifyToken, isAdmin, configController.getByClave);
router.put('/:clave', verifyToken, isAdmin, configController.update);
router.delete('/:clave', verifyToken, isAdmin, configController.delete);

module.exports = router;