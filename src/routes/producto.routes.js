// src/routes/producto.routes.js

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');

router.get('/', productoController.getAll);
router.get('/categoria/:categoriaId', productoController.getByCategoria);
router.get('/:id', productoController.getById);
router.post('/', productoController.create);
router.put('/:id', productoController.update);
router.patch('/:id/toggle', productoController.toggleDisponible);
router.delete('/:id', productoController.delete);

module.exports = router;