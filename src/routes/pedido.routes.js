// src/routes/pedido.routes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ============================================
// ⚠️ RUTAS ESPECÍFICAS PRIMERO (ANTES de /:id)
// ============================================

// Pedidos pendientes
router.get('/pendientes', verifyToken, pedidoController.getPendientes);

// Pedidos pagados
router.get('/pagados', verifyToken, pedidoController.getPagados);

// ✅ Pedidos pagados del mesero actual (coincide con el frontend)
router.get('/pagados-mesero', verifyToken, pedidoController.getPedidosPagadosMesero);

// ⚠️ Alias de compatibilidad (por si acaso)
router.get('/entregados/mesero', verifyToken, pedidoController.getPedidosPagadosMesero);

// Pedidos por tipo de entrega
router.get('/tipo/:tipo', verifyToken, pedidoController.getByTipoEntrega);

// ============================================
// RUTAS CON PARÁMETROS (DESPUÉS de las específicas)
// ============================================

router.get('/', verifyToken, pedidoController.getAll);
router.post('/', verifyToken, pedidoController.create);

router.get('/:id', verifyToken, pedidoController.getById);
router.put('/:id/estado', verifyToken, pedidoController.updateEstado);
router.patch('/:id/pagar', verifyToken, pedidoController.marcarPagado);

router.delete('/:id', verifyToken, isAdmin, pedidoController.delete);

module.exports = router;