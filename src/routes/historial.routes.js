// src/routes/historial.routes.js
const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historial.controller');
const { verifyToken } = require('../middleware/auth');

//  Ruta unificada (una sola petición trae todo)
router.get('/resumen-completo', verifyToken, historialController.resumenCompleto);

// NUEVO: Detalle de compras de un cliente (DEBE IR ANTES que /:id genéricos)
router.get('/cliente/:clienteId/compras', verifyToken, historialController.getComprasByCliente);

// Rutas individuales
router.get('/', verifyToken, historialController.getAll);
router.get('/estadisticas', verifyToken, historialController.estadisticas);
router.get('/clientes/resumen', verifyToken, historialController.resumenClientes);
router.get('/clientes/sin-compras', verifyToken, historialController.clientesSinCompras);
router.get('/clientes/con-compras', verifyToken, historialController.clientesConCompras);
router.get('/usuarios/activos', verifyToken, historialController.usuariosActivos);

module.exports = router;