// routes/cliente.routes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.get('/', verifyToken, clienteController.getAll);
router.get('/buscar', verifyToken, clienteController.buscar);
router.get('/:id', verifyToken, clienteController.getById);
router.post('/', verifyToken, clienteController.create);
router.put('/:id', verifyToken, clienteController.update);
router.delete('/:id', verifyToken, clienteController.delete);

module.exports = router;