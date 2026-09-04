// src/routes/producto.routes.js

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ✅ RUTAS PÚBLICAS
router.get('/', productoController.getAll);
router.get('/disponibles', productoController.getDisponibles);
router.get('/categoria/:categoriaId', productoController.getByCategoria);
router.get('/:id', productoController.getById);

// 🔒 RUTAS PROTEGIDAS
router.post('/', verifyToken, isAdmin, productoController.create);
router.put('/:id', verifyToken, isAdmin, productoController.update);
router.patch('/:id/toggle', verifyToken, isAdmin, productoController.toggleDisponible);
router.delete('/:id', verifyToken, isAdmin, productoController.delete);

module.exports = router;