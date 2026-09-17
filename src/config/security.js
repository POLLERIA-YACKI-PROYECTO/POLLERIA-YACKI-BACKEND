// src/config/security.js
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const cors = require('cors');
const compression = require('compression');

// ELIMINADO: const rateLimit = require('express-rate-limit');

// ============================================
// CORS
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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS bloqueado para origin: ${origin}`);
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
// SANITIZACIÓN XSS
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

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);

  next();
};

// ============================================
// MIDDLEWARE DE SEGURIDAD
// SIN rate limits (se aplican en app.js desde rate-limit.js)
// ============================================
const securityMiddleware = (app) => {
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

  app.use(compression());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // ELIMINADO: app.use(limiter);
  // ELIMINADO: app.use('/api/auth', authLimiter);

  app.use(sanitizeInput);
  app.use(mongoSanitize());

  app.use((req, res, next) => {
    // Solo loguear errores, no cada petición (reduce ruido)
    next();
  });
};

module.exports = {
  securityMiddleware,
  corsOptions,
  sanitizeInput
};