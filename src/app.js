// src/app.js
const express = require('express');
const path = require('path');

const { securityMiddleware } = require('./config/security');
const { swaggerUi, specs } = require('./config/swagger');
const { logger } = require('./utils/logger');

const {
  authLimiter,
  pedidosLimiter,
  uploadLimiter,
  generalLimiter,
  strictLimiter
} = require('./middleware/rate-limit');

const app = express();

securityMiddleware(app);

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// ✅ TIMEOUT GLOBAL — mejorado
app.use((req, res, next) => {
  // ⬇️ Guarda el timeout para limpiarlo si la respuesta termina antes
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logger.error(`Timeout en ${req.method} ${req.url}`);
      res.status(503).json({
        success: false,
        error: 'La petición tardó demasiado. Intenta de nuevo.'
      });
    }
  }, 30000);

  // ⬇️ Limpia el timeout cuando la respuesta termina
  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  next();
});

// ✅ HEALTH CHECK — MUY IMPORTANTE que esté ANTES de cualquier rate limit
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

// ✅ RATE LIMIT POR RUTA (solo en producción)
if (!isDevelopment) {
  console.log('🔒 Rate limit ACTIVADO - Aplicando por ruta...');

  app.use('/api/auth/login-admin', authLimiter);
  app.use('/api/auth/login-mesero', authLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/cliente/login', authLimiter);
  app.use('/api/auth/cliente/register', authLimiter);

  app.post('/api/pedidos-cliente', pedidosLimiter);
  app.post('/api/pedidos', pedidosLimiter);
  app.post('/api/pedidos-cliente/:id/comprobante', uploadLimiter);

  app.use('/api/dashboard', strictLimiter);
  app.use('/api/reportes', strictLimiter);

  // 🌐 General — al final, con límite alto
  app.use('/api', generalLimiter);
} else {
  console.log('🔓 Rate limit DESACTIVADO - Todas las peticiones permitidas');
}

// ARCHIVOS ESTÁTICOS
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '7d',  // ⬆️ cachea imágenes 7 días en el navegador
    setHeaders: (response) => {
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// SWAGGER
if (process.env.SWAGGER_ENABLED !== 'false') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `.swagger-ui .topbar { display: none } .swagger-ui .info .title { color: #e67e22 }`,
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

// RUTAS
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/producto.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/ventas', require('./routes/venta.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/clientes', require('./routes/cliente.routes'));
app.use('/api/pedidos', require('./routes/pedido.routes'));
app.use('/api/pedidos-cliente', require('./routes/pedidoCliente.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reportes', require('./routes/reporte.routes'));
app.use('/api/mesas', require('./routes/mesa.routes'));
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/historial', require('./routes/historial.routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  logger.error('Error no controlado:', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

module.exports = app;