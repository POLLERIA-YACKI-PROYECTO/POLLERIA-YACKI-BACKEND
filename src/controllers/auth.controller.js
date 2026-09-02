// src\controllers\auth.controller.js

const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

// Login para admin
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;
    
    console.log('🔐 Login admin con DNI:', dni);
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ 
        success: false,
        error: 'DNI inválido' 
      });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'cajero') {
      return res.status(403).json({ 
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador o cajero' 
      });
    }

    // ✅ Token con expiración de 7 días
    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete usuario.password;

    console.log('✅ Login exitoso para:', usuario.nombre);

    res.json({ 
      success: true,
      ...usuario, 
      token 
    });
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión' 
    });
  }
};

// Login para mesero
exports.loginMesero = async (req, res) => {
  try {
    const { dni } = req.body;
    
    console.log('🔐 Login mesero con DNI:', dni);
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ 
        success: false,
        error: 'DNI inválido' 
      });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    if (usuario.rol !== 'mesero') {
      return res.status(403).json({ 
        success: false,
        error: 'Acceso denegado. Se requiere rol de mesero' 
      });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete usuario.password;

    console.log('✅ Login exitoso para mesero:', usuario.nombre);

    res.json({ 
      success: true,
      ...usuario, 
      token 
    });
  } catch (error) {
    console.error('Error en loginMesero:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión' 
    });
  }
};

// Login general (para compatibilidad)
exports.login = async (req, res) => {
  try {
    const { dni } = req.body;
    
    console.log('🔐 Login general con DNI:', dni);
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ 
        success: false,
        error: 'DNI inválido' 
      });
    }

    const usuario = await Usuario.findByDni(dni);
    
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete usuario.password;

    res.json({ 
      success: true,
      ...usuario, 
      token 
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión' 
    });
  }
};