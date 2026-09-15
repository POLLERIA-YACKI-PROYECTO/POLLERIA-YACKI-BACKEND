// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// ✅ Leer NODE_ENV una sola vez
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// ✅ Un solo log informativo
const estado = isDevelopment ? '🔓 DESACTIVADO' : '🔒 ACTIVADO';
console.log(`⏱️  Rate limit: ${estado} (${process.env.NODE_ENV || 'development'})`);

// ============================================
// 🔐 LOGIN / REGISTRO
// ============================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 9999 : 20,
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación. Espera 15 minutos antes de reintentar.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  skipSuccessfulRequests: true,
  keyGenerator: (req, res) => {
    const identificador = req.body?.email || req.body?.dni || 'anonimo';
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${identificador}`;
  }
});

// ============================================
// 📦 CREAR PEDIDOS
// ============================================
const pedidosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDevelopment ? 9999 : 30,
  message: {
    success: false,
    error: 'Estás creando muchos pedidos. Espera un momento antes de continuar.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  keyGenerator: (req, res) => {
    return req.userId ? `user-${req.userId}` : ipKeyGenerator(req, res);
  }
});

// ============================================
// 📤 SUBIR COMPROBANTES
// ============================================
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDevelopment ? 9999 : 20,
  message: {
    success: false,
    error: 'Demasiadas subidas de archivos. Espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});

// ============================================
// 🌐 GENERAL
// ============================================
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDevelopment ? 99999 : 600,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Por favor espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  keyGenerator: (req, res) => {
    return req.userId ? `user-${req.userId}` : ipKeyGenerator(req, res);
  }
});

// ============================================
// 📖 LECTURAS (GET públicos: categorías, productos, etc.)
// ============================================
const lecturaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,           // 1 minuto
  max: isDevelopment ? 9999 : 180,   // 180 lecturas/min en producción
  message: {
    success: false,
    error: 'Demasiadas lecturas. Espera un momento antes de continuar.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  keyGenerator: (req, res) => {
    return req.userId ? `user-${req.userId}` : ipKeyGenerator(req, res);
  }
});

// ============================================
// 🛡️ ESTRICTO
// ============================================
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDevelopment ? 9999 : 100,
  message: {
    success: false,
    error: 'Demasiadas peticiones a esta ruta. Espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment
});

// ============================================
// 🚫 BLOQUEO
// ============================================
const blockLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDevelopment ? 99999 : 5,
  message: {
    success: false,
    error: 'Tu IP ha sido bloqueada temporalmente por actividad sospechosa.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
  skipSuccessfulRequests: true
});

module.exports = {
  authLimiter,
  pedidosLimiter,
  uploadLimiter,
  generalLimiter,
  lecturaLimiter, // ✅ AHORA SÍ EXISTE
  strictLimiter,
  blockLimiter
};