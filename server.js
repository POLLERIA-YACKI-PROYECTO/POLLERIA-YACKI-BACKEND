// server.js (CORREGIDO)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { securityMiddleware } = require('./src/config/security');
const { logger } = require('./src/utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
securityMiddleware(app);

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/productos', require('./src/routes/producto.routes'));
app.use('/api/categorias', require('./src/routes/categoria.routes'));
app.use('/api/ventas', require('./src/routes/venta.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));
app.use('/api/clientes', require('./src/routes/cliente.routes'));
app.use('/api/pedidos', require('./src/routes/pedido.routes'));
app.use('/api/reportes', require('./src/routes/reporte.routes'));
app.use('/api/mesas', require('./src/routes/mesa.routes'));
// app.use('/api/configuracion', require('./src/routes/configuracion.routes'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// RUTA 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  logger.error('❌ Error no controlado:', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Error interno del servidor' : err.message
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  logger.info(`✅ Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`🔒 Seguridad activada: Helmet, Rate Limiting, Sanitización`);
});

// ============================================
// MANEJO DE SEÑALES
// ============================================
process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});