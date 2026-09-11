// src/config/security.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const cors = require('cors');
const compression = require('compression');

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, apps móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS bloqueado para origin: ${origin}`);
    return callback(new Error(`CORS no permitido para: ${origin}`), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'Authorization']
};

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación, por favor intenta más tarde'
  }
});

// ============================================
// SANITIZACIÓN DE ENTRADA (XSS)
// ============================================
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj) return obj;

    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      }).trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const cleaned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // No sanitizar campos sensibles que contengan caracteres especiales
          if (key === 'password' || key === 'token') {
            cleaned[key] = obj[key];
          } else {
            const cleanKey = key.replace(/[^\w\s-]/gi, '');
            cleaned[cleanKey] = sanitizeObject(obj[key]);
          }
        }
      }
      return cleaned;
    }

    return obj;
  };

  // Solo sanitizar body y query (params puede contener IDs)
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);

  next();
};

// ============================================
// MIDDLEWARE DE SEGURIDAD COMPLETO
// ============================================
const securityMiddleware = (app) => {
  // 1. Body parsers (ANTES de todo)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // 2. Helmet (headers de seguridad)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,

      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'http://localhost:3000',
            'http://localhost:4200',
            'https:'
          ],
          connectSrc: [
            "'self'",
            'http://localhost:3000',
            'http://localhost:4200',
            process.env.API_URL || 'http://localhost:3000'
          ],
          fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },

      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  );

  // 3. Compresión gzip
  app.use(compression());

  // 4. CORS
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Preflight

  // 5. Rate limiting global
  app.use(limiter);

  // 6. Rate limiting específico para auth
  app.use('/api/auth', authLimiter);

  // 7. Sanitización de entrada
  app.use(sanitizeInput);

  // 8. Prevención de inyección NoSQL
  app.use(mongoSanitize());

  // 9. Logging de seguridad
  app.use((req, res, next) => {
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.path} | IP: ${req.ip}`
    );
    next();
  });
};

module.exports = {
  securityMiddleware,
  limiter,
  authLimiter,
  corsOptions,
  sanitizeInput
};