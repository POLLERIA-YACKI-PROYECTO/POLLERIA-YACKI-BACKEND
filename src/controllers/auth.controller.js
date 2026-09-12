// src/controllers/auth.controller.js
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const HistorialActividad = require('../models/HistorialActividad');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

// Helper para IP y user-agent
const getMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
  user_agent: req.headers['user-agent'] || null
});

// Helper para registrar actividad sin romper el flujo
const logActividad = async (data) => {
  try {
    await HistorialActividad.registrar(data);
  } catch (err) {
    logger.error('Error al registrar historial:', err);
  }
};

// ============================================
// LOGIN ADMIN / CAJERO (por DNI)
// ============================================
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Intento con DNI inválido: ${dni || 'vacío'}`,
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Login fallido con DNI: ${dni}`,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'cajero') {
      await logActividad({
        usuario_id: usuario.id,
        tipo_usuario: 'usuario',
        accion: 'login_fallido',
        descripcion: `Rol no autorizado (${usuario.rol}) intentó login admin`,
        ...getMeta(req)
      });
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de administrador o cajero'
      });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActividad({
      usuario_id: usuario.id,
      tipo_usuario: 'usuario',
      accion: 'login_exitoso',
      descripcion: `Login admin/cajero: ${usuario.nombre} (${usuario.rol})`,
      ...getMeta(req)
    });

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
      message: 'Error al iniciar sesión'
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
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Intento mesero con DNI inválido: ${dni || 'vacío'}`,
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Login mesero fallido con DNI: ${dni}`,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    if (usuario.rol !== 'mesero') {
      await logActividad({
        usuario_id: usuario.id,
        tipo_usuario: 'usuario',
        accion: 'login_fallido',
        descripcion: `Rol ${usuario.rol} intentó login mesero`,
        ...getMeta(req)
      });
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de mesero'
      });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActividad({
      usuario_id: usuario.id,
      tipo_usuario: 'usuario',
      accion: 'login_exitoso',
      descripcion: `Login mesero: ${usuario.nombre}`,
      ...getMeta(req)
    });

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
      message: 'Error al iniciar sesión'
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
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Intento con DNI inválido: ${dni || 'vacío'}`,
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Login fallido con DNI: ${dni}`,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI inválido o incorrecto'
      });
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logActividad({
      usuario_id: usuario.id,
      tipo_usuario: 'usuario',
      accion: 'login_exitoso',
      descripcion: `Login: ${usuario.nombre} (${usuario.rol})`,
      ...getMeta(req)
    });

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
      message: 'Error al iniciar sesión'
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
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: `Login cliente fallido (email no existe): ${email}`,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    if (!cliente.activo) {
      await logActividad({
        cliente_id: cliente.id,
        tipo_usuario: 'cliente',
        accion: 'login_fallido',
        descripcion: `Cuenta desactivada: ${email}`,
        ...getMeta(req)
      });
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta con soporte.'
      });
    }

    const passwordValida = await bcrypt.compare(password, cliente.password);

    if (!passwordValida) {
      await logActividad({
        cliente_id: cliente.id,
        tipo_usuario: 'cliente',
        accion: 'login_fallido',
        descripcion: `Contraseña incorrecta para ${email}`,
        ...getMeta(req)
      });
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

    await logActividad({
      cliente_id: cliente.id,
      tipo_usuario: 'cliente',
      accion: 'login_exitoso',
      descripcion: `Login cliente: ${email}`,
      ...getMeta(req)
    });

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

    await logActividad({
      cliente_id: nuevoCliente.id,
      tipo_usuario: 'cliente',
      accion: 'registro',
      descripcion: `Nuevo cliente registrado: ${nombre} (${email})`,
      datos: { telefono, direccion },
      ...getMeta(req)
    });

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