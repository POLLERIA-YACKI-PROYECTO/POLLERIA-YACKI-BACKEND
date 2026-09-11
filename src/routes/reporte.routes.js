// src/routes/reporte.routes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin/cajero
router.use(verifyToken, isAdmin);

// Reporte general de ventas por período
router.get('/ventas', reporteController.getReporteVentas);

// Reporte diario de cajero
router.get('/diario-cajero', reporteController.getReporteDiarioCajero);

//  Reporte por cliente (con alias para compatibilidad)
router.get('/cliente', reporteController.getReportePorCliente);
router.get('/por-cliente', reporteController.getReportePorCliente); // Alias

// Reporte motorizada
router.get('/motorizada', reporteController.getReporteMotorizada);

module.exports = router;