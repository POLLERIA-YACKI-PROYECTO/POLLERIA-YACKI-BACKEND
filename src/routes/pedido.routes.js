// src/routes/pedido.routes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { verifyToken, isAdmin, isMesero } = require('../middleware/auth');

console.log('🔴 Cargando rutas de pedidos...');

// Todas las rutas requieren autenticación
router.get('/', verifyToken, pedidoController.getAll);
router.get('/:id', verifyToken, pedidoController.getById);
router.post('/', verifyToken, pedidoController.create);
router.put('/:id/estado', verifyToken, pedidoController.updateEstado);
router.delete('/:id', verifyToken, pedidoController.delete);

// ✅ Rutas solo admin
router.get('/pendientes', verifyToken, isAdmin, pedidoController.getPendientes);
router.get('/pagados', verifyToken, isAdmin, pedidoController.getPagados);
router.get('/tipo/:tipo', verifyToken, isAdmin, pedidoController.getByTipoEntrega);
router.put('/:id/pagar', verifyToken, isAdmin, pedidoController.marcarPagado);

// ✅ RUTA PARA MESERO - Ver sus propios pedidos entregados
router.get('/mesero/pagados', verifyToken, isMesero, pedidoController.getPedidosPagadosMesero);

console.log('🟢 Rutas de pedidos cargadas correctamente');

module.exports = router;