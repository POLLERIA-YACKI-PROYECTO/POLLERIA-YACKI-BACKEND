// src/config/security.js
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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
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

// Validación de entrada (versión simple)
const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      
      if (rule.required && (!value || value.trim() === '')) {
        errors.push(`El campo ${field} es requerido`);
      }
      
      if (rule.type === 'number' && value && isNaN(value)) {
        errors.push(`El campo ${field} debe ser un número`);
      }
      
      if (rule.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`El campo ${field} debe ser un email válido`);
      }
      
      if (rule.type === 'dni' && value && !/^[0-9]{8}$/.test(value)) {
        errors.push(`El campo ${field} debe ser un DNI válido (8 dígitos)`);
      }
      
      if (rule.type === 'phone' && value && !/^[0-9]{9}$/.test(value)) {
        errors.push(`El campo ${field} debe ser un teléfono válido (9 dígitos)`);
      }
      
      if (rule.min && value && value.length < rule.min) {
        errors.push(`El campo ${field} debe tener al menos ${rule.min} caracteres`);
      }
      
      if (rule.max && value && value.length > rule.max) {
        errors.push(`El campo ${field} debe tener máximo ${rule.max} caracteres`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: errors
      });
    }
    
    next();
  };
};

// Middleware de seguridad completo
const securityMiddleware = (app) => {
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
  validateBody,
  limiter,
  authLimiter,
  corsOptions,
  sanitizeInput
};