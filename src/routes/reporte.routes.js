const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

router.get('/ventas', reporteController.getReporteVentas);
router.get('/diario-cajero', reporteController.getReporteDiarioCajero);

module.exports = router;