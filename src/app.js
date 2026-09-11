// src/app.js
// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN EXPRESS
// ============================================
// Este archivo exporta la app de Express SIN iniciar el servidor.
// Esto permite que los tests con Supertest funcionen correctamente.

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { securityMiddleware } = require('./config/security');
const { swaggerUi, specs } = require('./config/swagger');
const { logger } = require('./utils/logger');
const { authLimiter, generalLimiter } = require('./middleware/rate-limit');

dotenv.config();

const app = express();

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
securityMiddleware(app);

// ============================================
// RATE LIMIT - SOLO APLICAR SI NO ES DESARROLLO/TEST
// ============================================
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

if (!isDevelopment) {
  console.log('Rate limit activado');
  app.use('/api', generalLimiter);
  app.use('/api/auth', authLimiter);
} else {
  console.log('Rate limit desactivado (modo desarrollo/test)');
}

// ============================================
// ARCHIVOS ESTÁTICOS (IMÁGENES)
// ============================================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (response) => {
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      response.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
    },
  })
);

// ============================================
// SWAGGER DOCUMENTATION
// ============================================
if (process.env.SWAGGER_ENABLED !== 'false') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e67e22 }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'list'
    }
  }));
  
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/producto.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/ventas', require('./routes/venta.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/clientes', require('./routes/cliente.routes'));
app.use('/api/pedidos', require('./routes/pedido.routes'));
app.use('/api/reportes', require('./routes/reporte.routes'));
app.use('/api/mesas', require('./routes/mesa.routes'));
app.use('/api/configuracion', require('./routes/configuracion.routes'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      rateLimit: isDevelopment ? 'disabled' : 'enabled'
    });
  } catch (error) {
    logger.error('Health check falló:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
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
  logger.error('Error no controlado:', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ============================================
// EXPORTAR APP (para tests con Supertest)
// ============================================
module.exports = app;