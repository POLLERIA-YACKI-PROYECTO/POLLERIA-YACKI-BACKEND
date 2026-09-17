// server.js (en la raíz del proyecto)
// ============================================
// PASO 1: CARGAR VARIABLES DE ENTORNO PRIMERO
// ============================================
const dotenv = require('dotenv');
const path = require('path');

// Forzar la carga desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '.env') });

// ============================================
// PASO 2: AHORA SÍ IMPORTAR LA APP
// ============================================
// Al importar app.js, rate-limit.js ya verá NODE_ENV correcto
const app = require('./src/app');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// ============================================
// PASO 3: INICIAR SERVIDOR
// ============================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('POLLERÍA DOÑA YACKI - SERVIDOR');
    console.log('========================================');
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Docs: http://localhost:${PORT}/api/docs`);
    console.log(`Seguridad: Activada`);
    console.log(`Estáticos: /uploads`);
    console.log(`Rate limit: ${isDevelopment ? 'DESACTIVADO' : 'ACTIVADO'}`);
    console.log('========================================');
    console.log('');
  });
}

// ============================================
// MANEJO DE SEÑALES
// ============================================
process.on('SIGTERM', () => {
  logger.info('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

module.exports = app;