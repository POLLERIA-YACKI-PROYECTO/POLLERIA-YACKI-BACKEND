// src/app.js
const express = require('express');
const path = require('path');

// ❌ NO cargar dotenv aquí (ya se cargó en server.js)

const { securityMiddleware } = require('./config/security');
const { swaggerUi, specs } = require('./config/swagger');
const { logger } = require('./utils/logger');

// ✅ Importar los limitadores DESPUÉS de que dotenv esté cargado
const {
  authLimiter,
  pedidosLimiter,
  uploadLimiter,
  generalLimiter,
  strictLimiter
} = require('./middleware/rate-limit');

const app = express();

// Middlewares de seguridad
securityMiddleware(app);

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// ============================================
// ✅ TIMEOUT GLOBAL POR PETICIÓN
// Evita que una petición se quede colgada para siempre
// ocupando una conexión del pool
// ============================================
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    logger.error(`Timeout en ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: 'La petición tardó demasiado. Intenta de nuevo.'
      });
    }
  });
  next();
});

// ============================================
// ✅ RATE LIMIT POR RUTA (solo en producción)
// ============================================
if (!isDevelopment) {
  console.log('🔒 Rate limit ACTIVADO - Aplicando por ruta...');

  // 🔐 Login / Registro (POST)
  app.use('/api/auth/login-admin', authLimiter);
  app.use('/api/auth/login-mesero', authLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/cliente/login', authLimiter);
  app.use('/api/auth/cliente/register', authLimiter);

  // 📦 Crear pedidos (solo POST, no GET)
  // Aplicamos el limiter SOLO a las peticiones POST,
  // no a los GET que hace el mesero/cliente al listar
  app.post('/api/pedidos-cliente', pedidosLimiter);
  app.post('/api/pedidos', pedidosLimiter);

  // 📤 Subir comprobantes (POST)
  app.post('/api/pedidos-cliente/:id/comprobante', uploadLimiter);

  // 🛡️ Operaciones admin críticas
  app.use('/api/dashboard', strictLimiter);
  app.use('/api/reportes', strictLimiter);

  // 🌐 General (aplicar SOLO a rutas /api, no a /uploads)
  // Nota: /uploads ya se sirve con express.static más abajo,
  // pero lo registramos después del generalLimiter.
  // Para no limitar imágenes, generalLimiter se aplica solo a /api.
  app.use('/api', generalLimiter);

  // ⚠️ NO aplicar generalLimiter a /uploads
  // (las imágenes se sirven como archivos estáticos y no deben
  //  consumir cuota del rate limit)

} else {
  console.log('🔓 Rate limit DESACTIVADO - Todas las peticiones permitidas');
}

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (response) => {
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    }
  })
);

// ============================================
// SWAGGER
// ============================================
if (process.env.SWAGGER_ENABLED !== 'false') {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
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
    })
  );

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
app.use('/api/pedidos-cliente', require('./routes/pedidoCliente.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reportes', require('./routes/reporte.routes'));
app.use('/api/mesas', require('./routes/mesa.routes'));
app.use('/api/configuracion', require('./routes/configuracion.routes'));
app.use('/api/historial', require('./routes/historial.routes'));

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
// 404
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

module.exports = app;