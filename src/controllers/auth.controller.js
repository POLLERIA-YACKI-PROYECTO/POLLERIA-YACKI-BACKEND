// src/controllers/auth.controller.js
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

// ============================================
// LOGIN ADMIN / CAJERO (por DNI)
// ============================================
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;

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
    logger.error('Error en loginAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
};

// ============================================
// LOGIN MESERO (por DNI)
// ============================================
exports.loginMesero = async (req, res) => {
  try {
    const { dni } = req.body;

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

    res.json({
      success: true,
      ...usuario,
      token
    });
  } catch (error) {
    logger.error('Error en loginMesero:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
};

// ============================================
// LOGIN GENERAL (por DNI - personal)
// ============================================
exports.login = async (req, res) => {
  try {
    const { dni } = req.body;

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
    logger.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
};

// ============================================
// LOGIN CLIENTE (email + password)
// ============================================
exports.loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const cliente = await Cliente.findByEmail(email);

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    if (!cliente.activo) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta con soporte.'
      });
    }

    const passwordValida = await bcrypt.compare(password, cliente.password);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await Cliente.updateUltimoAcceso(cliente.id);

    const { password: _, ...clienteData } = cliente;

    res.json({
      success: true,
      cliente: clienteData,
      token
    });
  } catch (error) {
    logger.error('Error en loginCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

// ============================================
// REGISTRO CLIENTE
// ============================================
exports.registerCliente = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son obligatorios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const existente = await Cliente.findByEmail(email);
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      email,
      telefono,
      direccion,
      password
    });

    const token = jwt.sign(
      { id: nuevoCliente.id, email: nuevoCliente.email, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      cliente: nuevoCliente,
      token
    });
  } catch (error) {
    logger.error('Error en registerCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente'
    });
  }
};