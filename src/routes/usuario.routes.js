const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser admin
router.get('/', verifyToken, isAdmin, usuarioController.getAll);
router.get('/:id', verifyToken, isAdmin, usuarioController.getById);
router.post('/', verifyToken, isAdmin, usuarioController.create);
router.put('/:id', verifyToken, isAdmin, usuarioController.update);
router.delete('/:id', verifyToken, isAdmin, usuarioController.delete);

module.exports = router;