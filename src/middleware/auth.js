// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

console.log('🔑 JWT_SECRET configurado:', JWT_SECRET ? '✅ Definido' : '❌ No definido');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Verificando token...');
    
    if (!authHeader) {
      console.log('❌ No se proporcionó token');
      return res.status(401).json({ 
        success: false,
        error: 'Token no proporcionado' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token inválido');
      return res.status(401).json({ 
        success: false,
        error: 'Token inválido' 
      });
    }

    console.log('📝 Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decodificado:', decoded);
    
    req.userId = decoded.id;
    req.userRol = decoded.rol;
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('❌ Error en verifyToken:', error.message);
    
    let mensaje = 'Token inválido o expirado';
    if (error.message === 'jwt expired') {
      mensaje = 'Token expirado. Por favor, inicie sesión nuevamente';
    } else if (error.message === 'invalid signature') {
      mensaje = 'Firma de token inválida';
    }
    
    return res.status(401).json({ 
      success: false,
      error: mensaje,
      code: error.message
    });
  }
};

exports.isAdmin = (req, res, next) => {
  console.log('🔐 Verificando rol de admin...');
  console.log('📝 Rol del usuario:', req.userRol);
  
  if (req.userRol === 'admin' || req.userRol === 'cajero') {
    console.log('✅ Acceso permitido');
    next();
  } else {
    console.log('❌ Acceso denegado');
    res.status(403).json({ 
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador o cajero' 
    });
  }
};

exports.isMesero = (req, res, next) => {
  console.log('🔐 Verificando rol de mesero...');
  console.log('📝 Rol del usuario:', req.userRol);
  
  if (req.userRol === 'mesero') {
    console.log('✅ Acceso permitido para mesero');
    next();
  } else {
    console.log('❌ Acceso denegado - Se requiere rol de mesero');
    res.status(403).json({ 
      success: false,
      error: 'Acceso denegado. Se requiere rol de mesero' 
    });
  }
};