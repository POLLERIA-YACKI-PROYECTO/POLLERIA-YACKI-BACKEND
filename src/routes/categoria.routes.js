// src/routes/categoria.routes.js

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ✅ RUTAS PÚBLICAS - No requieren autenticación
router.get('/', categoriaController.getAll);
router.get('/activas', categoriaController.getActive);
router.get('/:id', categoriaController.getById);
router.get('/:id/productos', categoriaController.getProductos);

// 🔒 RUTAS PROTEGIDAS - Solo Admin
router.post('/', verifyToken, isAdmin, categoriaController.create);
router.put('/:id', verifyToken, isAdmin, categoriaController.update);
router.delete('/:id', verifyToken, isAdmin, categoriaController.delete);

module.exports = router;