// src/routes/configuracion.routes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracion.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

//  RUTAS PÚBLICAS - No requieren autenticación (accesibles para todos)
router.get('/', configController.getAll);
router.get('/:clave', configController.getByClave);

//  RUTAS PROTEGIDAS - Solo Admin (requieren autenticación)
router.post('/', verifyToken, isAdmin, configController.create);
router.put('/:clave', verifyToken, isAdmin, configController.update);
router.delete('/:clave', verifyToken, isAdmin, configController.delete);

module.exports = router;