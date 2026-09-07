// server.js
const express = require('express');
const path = require('path'); // ✅ IMPORTANTE: debe estar importado
const dotenv = require('dotenv');
const { securityMiddleware } = require('./src/config/security');
const { swaggerUi, specs } = require('./src/config/swagger');
const { logger } = require('./src/utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================
securityMiddleware(app);

// ============================================
// ✅ ARCHIVOS ESTÁTICOS (IMÁGENES)
// ============================================
// Servir la carpeta uploads como estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/productos', require('./src/routes/producto.routes'));
app.use('/api/categorias', require('./src/routes/categoria.routes'));
app.use('/api/ventas', require('./src/routes/venta.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));
app.use('/api/clientes', require('./src/routes/cliente.routes'));
app.use('/api/pedidos', require('./src/routes/pedido.routes'));
app.use('/api/reportes', require('./src/routes/reporte.routes'));
app.use('/api/mesas', require('./src/routes/mesa.routes'));
app.use('/api/configuracion', require('./src/routes/configuracion.routes'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./src/config/database');
    await db.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('❌ Health check falló:', error);
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
  logger.error('❌ Error no controlado:', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api/docs`);
  console.log(`🔒 Seguridad activada`);
  console.log(`📁 Archivos estáticos: /uploads`);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});