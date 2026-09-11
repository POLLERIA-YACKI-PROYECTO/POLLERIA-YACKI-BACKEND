// server.js (en la raíz del proyecto)
// ============================================
// SERVIDOR - SOLO INICIA LA APP
// ============================================
// Este archivo SOLO inicia el servidor. La app está en src/app.js
// Esto permite que los tests importen la app sin iniciar el servidor.

const app = require('./src/app');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// ============================================
// NO INICIAR SERVIDOR EN MODO TEST
// ============================================
// Cuando se ejecutan tests con Jest, NODE_ENV=test.
// Supertest se encarga de iniciar la app en un puerto efímero.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Documentación API: http://localhost:${PORT}/api/docs`);
    console.log(`Seguridad activada`);
    console.log(`Archivos estáticos: /uploads`);
    console.log(`Modo: ${isDevelopment ? 'DESARROLLO (rate limit desactivado)' : 'PRODUCCIÓN'}`);
  });
}

// ============================================
// MANEJO DE SEÑALES
// ============================================
process.on('SIGTERM', () => {
  logger.info('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

module.exports = app;