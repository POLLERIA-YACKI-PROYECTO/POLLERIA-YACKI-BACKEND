const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller');

router.get('/', pedidoController.getAll);
router.get('/:id', pedidoController.getById);
router.post('/', pedidoController.create);
router.put('/:id/estado', pedidoController.updateEstado);
router.delete('/:id', pedidoController.delete);

module.exports = router;