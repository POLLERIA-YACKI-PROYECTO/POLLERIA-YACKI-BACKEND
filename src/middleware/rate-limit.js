// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

// ✅ CONFIGURACIÓN PARA DESARROLLO - DESACTIVAR RATE LIMIT
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

console.log(`🚀 Rate limit: ${isDevelopment ? 'DESACTIVADO (modo desarrollo)' : 'ACTIVADO'}`);

// Rate limit para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: isDevelopment ? 100 : 10, // 100 intentos en desarrollo, 10 en producción
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Por favor espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar en desarrollo
    return isDevelopment;
  }
});

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: isDevelopment ? 100 : 30, // 100 peticiones en desarrollo, 30 en producción
  message: {
    success: false,
    error: 'Demasiadas peticiones. Por favor espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar en desarrollo
    return isDevelopment;
  }
});

module.exports = {
  authLimiter,
  generalLimiter
};