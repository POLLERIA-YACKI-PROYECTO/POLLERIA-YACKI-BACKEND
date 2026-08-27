// routes/pedido.routes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.get('/', verifyToken, pedidoController.getAll);
router.get('/pendientes', verifyToken, isAdmin, pedidoController.getPendientes);
router.get('/pagados', verifyToken, isAdmin, pedidoController.getPagados);
router.get('/tipo/:tipo', verifyToken, isAdmin, pedidoController.getByTipoEntrega);
router.get('/:id', verifyToken, pedidoController.getById);
router.post('/', verifyToken, pedidoController.create);
router.put('/:id/estado', verifyToken, pedidoController.updateEstado);
router.put('/:id/pagar', verifyToken, isAdmin, pedidoController.marcarPagado);
router.delete('/:id', verifyToken, pedidoController.delete);

module.exports = router;