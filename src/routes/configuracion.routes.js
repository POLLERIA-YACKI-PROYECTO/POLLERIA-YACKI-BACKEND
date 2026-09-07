// src/routes/configuracion.routes.js
const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracion.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// 🔒 Todas las rutas requieren autenticación y admin
router.use(verifyToken, isAdmin);

// Obtener toda la configuración
router.get('/', configController.getAll);

// Obtener configuración por clave
router.get('/:clave', configController.getByClave);

// Crear nueva configuración
router.post('/', configController.create);

// Actualizar configuración
router.put('/:clave', configController.update);

// Eliminar configuración
router.delete('/:clave', configController.delete);

module.exports = router;