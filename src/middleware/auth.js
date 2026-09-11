// src/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

console.log('JWT_SECRET configurado:', JWT_SECRET ? 'Definido' : 'No definido');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Verificando token...');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token no proporcionado o formato inválido');
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado o formato inválido'
      });
    }

    const token = authHeader.split(' ')[1];
    
    console.log('Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    req.userId = decoded.id;
    req.userRol = decoded.rol;
    req.userDni = decoded.dni;
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Error en verifyToken:', error.message);
    
    let mensaje = 'Token inválido o expirado';
    let codigo = error.message;
    
    if (error.message === 'jwt expired') {
      mensaje = 'Token expirado. Por favor, inicie sesión nuevamente';
      codigo = 'TOKEN_EXPIRED';
    } else if (error.message === 'invalid signature') {
      mensaje = 'Firma de token inválida';
      codigo = 'INVALID_SIGNATURE';
    } else if (error.message === 'jwt malformed') {
      mensaje = 'Token malformado';
      codigo = 'MALFORMED_TOKEN';
    }
    
    return res.status(401).json({
      success: false,
      error: mensaje,
      code: codigo
    });
  }
};

exports.isAdmin = (req, res, next) => {
  console.log('Verificando rol de admin...');
  console.log('Rol del usuario:', req.userRol);
  
  if (req.userRol === 'admin' || req.userRol === 'cajero') {
    console.log('Acceso permitido');
    next();
  } else {
    console.log('Acceso denegado - Se requiere admin o cajero');
    res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador o cajero'
    });
  }
};

exports.isMesero = (req, res, next) => {
  console.log('Verificando rol de mesero...');
  console.log('Rol del usuario:', req.userRol);
  
  if (req.userRol === 'mesero') {
    console.log('Acceso permitido para mesero');
    next();
  } else {
    console.log('Acceso denegado - Se requiere mesero');
    res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de mesero'
    });
  }
};