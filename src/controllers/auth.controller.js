// src\controllers\auth.controller.js
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key';

// Login para admin
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'cajero') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o cajero' });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete usuario.password;

    res.json({ ...usuario, token });
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Login para mesero
exports.loginMesero = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.rol !== 'mesero') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de mesero' });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete usuario.password;

    res.json({ ...usuario, token });
  } catch (error) {
    console.error('Error en loginMesero:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Login general (para compatibilidad)
exports.login = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete usuario.password;

    res.json({ ...usuario, token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};