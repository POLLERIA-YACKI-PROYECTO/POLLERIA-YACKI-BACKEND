// routes/venta.routes.js
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.get('/', verifyToken, ventaController.getAll);
router.get('/usuario/:usuarioId', verifyToken, ventaController.getByUsuario);
router.get('/tipo/:tipo', verifyToken, ventaController.getByTipoEntrega);
router.get('/resumen/usuario/:usuarioId', verifyToken, ventaController.getResumenPorUsuario);
router.get('/resumen/general', verifyToken, ventaController.getResumenGeneral);
router.get('/:id', verifyToken, ventaController.getById);
router.delete('/:id', verifyToken, ventaController.delete);

module.exports = router;