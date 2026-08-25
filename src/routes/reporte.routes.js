// routes/reporte.routes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

// Reporte general de ventas por período
router.get('/ventas', reporteController.getReporteVentas);

// Reporte diario de cajero
router.get('/diario-cajero', reporteController.getReporteDiarioCajero);

// Reporte por cliente
router.get('/cliente', reporteController.getReportePorCliente);

// Reporte motorizada
router.get('/motorizada', reporteController.getReporteMotorizada);

module.exports = router;