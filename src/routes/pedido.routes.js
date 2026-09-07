// src/routes/pedido.routes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ============================================
// ✅ RUTAS ESPECÍFICAS PRIMERO (sin parámetros)
// ============================================

// Obtener pedidos pendientes
router.get('/pendientes', verifyToken, pedidoController.getPendientes);

// Obtener pedidos pagados
router.get('/pagados', verifyToken, pedidoController.getPagados);

// Obtener pedidos entregados del mesero
router.get('/entregados/mesero', verifyToken, pedidoController.getPedidosPagadosMesero);

// Obtener pedidos por tipo de entrega
router.get('/tipo/:tipo', verifyToken, pedidoController.getByTipoEntrega);

// ============================================
// 🔒 RUTAS CON PARÁMETROS (después de las específicas)
// ============================================

// Obtener todos los pedidos
router.get('/', verifyToken, pedidoController.getAll);

// Obtener pedido por ID
router.get('/:id', verifyToken, pedidoController.getById);

// Crear pedido
router.post('/', verifyToken, pedidoController.create);

// Actualizar estado del pedido
router.put('/:id/estado', verifyToken, pedidoController.updateEstado);

// Marcar pedido como pagado
router.patch('/:id/pagar', verifyToken, pedidoController.marcarPagado);

// Eliminar pedido (solo admin)
router.delete('/:id', verifyToken, isAdmin, pedidoController.delete);

module.exports = router;