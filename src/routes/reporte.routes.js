// src/routes/reporte.routes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin/cajero
router.use(verifyToken, isAdmin);

// ============================================
// REPORTE GENERAL DE VENTAS
// ============================================
router.get('/ventas', reporteController.getReporteVentas);

// ============================================
// REPORTE DIARIO DE CAJERO
// ============================================
router.get('/diario-cajero', reporteController.getReporteDiarioCajero);

// ============================================
// REPORTE POR MESERO
// ============================================
router.get('/ventas-mesero', reporteController.getReporteVentasPorMesero);

// ============================================
// REPORTE POR CLIENTE
// ============================================
router.get('/cliente', reporteController.getReportePorCliente);
router.get('/por-cliente', reporteController.getReportePorCliente);

// ============================================
// REPORTE MOTORIZADA
// ============================================
router.get('/motorizada', reporteController.getReporteMotorizada);

// ============================================
// ✅ NUEVO: REPORTE SEMANAL
// ============================================
router.get('/semanal', reporteController.getReporteSemanal);

module.exports = router;