// src/config/security.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const cors = require('cors');
const compression = require('compression');

// Configuración de CORS segura
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count']
};

// Rate limiting por IP
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

// Rate limiting más estricto para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación, por favor intenta más tarde'
  }
});

// Sanitización de entrada
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
      return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
      const cleaned = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          const cleanKey = key.replace(/[^\w\s-]/gi, '');
          cleaned[cleanKey] = sanitizeObject(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
};

// Middleware de seguridad completo
const securityMiddleware = (app) => {
  // IMPORTANTE: express.json() DEBE ESTAR ANTES DE CUALQUIER RUTA
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Helmet para headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3000'],
        fontSrc: ["'self'"],
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
  }));

  // Compresión gzip
  app.use(compression());

  // CORS seguro
  app.use(cors(corsOptions));

  // Rate limiting global
  app.use(limiter);

  // Rate limiting para autenticación
  app.use('/api/auth', authLimiter);

  // Sanitización de entrada
  app.use(sanitizeInput);

  // Prevención de inyección NoSQL
  app.use(mongoSanitize());

  // Logging de seguridad
  app.use((req, res, next) => {
    console.log(`🔒 ${req.method} ${req.path} - IP: ${req.ip}`);
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