// src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Resumen unificado (ventas + pedidos web)
router.get(
  '/resumen-unificado',
  verifyToken,
  isAdmin,
  dashboardController.getResumenUnificado
);

module.exports = router;