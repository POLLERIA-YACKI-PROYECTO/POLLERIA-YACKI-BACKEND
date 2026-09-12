// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

console.log(`Rate limit: ${isDevelopment ? 'DESACTIVADO (modo desarrollo)' : 'ACTIVADO'}`);

// Rate limit para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: isDevelopment ? 200 : 10,
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Por favor espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto (antes era 1 segundo)
  max: isDevelopment ? 2000 : 100, // 2000 en dev, 100 en prod
  message: {
    success: false,
    error: 'Demasiadas peticiones. Por favor espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});

module.exports = {
  authLimiter,
  generalLimiter
};