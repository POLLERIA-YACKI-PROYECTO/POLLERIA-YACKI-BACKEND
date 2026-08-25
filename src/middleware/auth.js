const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key';

// Verificar token
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRol = decoded.rol;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Verificar si es administrador
exports.isAdmin = (req, res, next) => {
  if (req.userRol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// Verificar si es admin o cajero
exports.isAdminOrCajero = (req, res, next) => {
  if (req.userRol !== 'admin' && req.userRol !== 'cajero') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o cajero' });
  }
  next();
};

// Verificar si es mesero
exports.isMesero = (req, res, next) => {
  if (req.userRol !== 'mesero') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de mesero' });
  }
  next();
};