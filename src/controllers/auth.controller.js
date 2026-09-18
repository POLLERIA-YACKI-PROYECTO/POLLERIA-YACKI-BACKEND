// src/controllers/auth.controller.js
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const HistorialActividad = require('../models/HistorialActividad');
const emailService = require('../services/email.service');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key-2026';

const getMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
  user_agent: req.headers['user-agent'] || null
});

const logActividad = async (data) => {
  try {
    await HistorialActividad.registrar(data);
  } catch (err) {
    logger.error('Error al registrar historial: ' + err.message);
  }
};

const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

// ============================================
// LOGIN ADMIN / CAJERO
// ============================================
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Intento con DNI invalido: ' + (dni || 'vacio'),
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI invalido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Login fallido con DNI: ' + dni,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI invalido o incorrecto'
      });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'cajero') {
      await logActividad({
        usuario_id: usuario.id,
        tipo_usuario: 'usuario',
        accion: 'login_fallido',
        descripcion: 'Rol no autorizado (' + usuario.rol + ') intento login admin',
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
      descripcion: 'Login admin/cajero: ' + usuario.nombre + ' (' + usuario.rol + ')',
      ...getMeta(req)
    });

    delete usuario.password;

    res.json({
      success: true,
      ...usuario,
      token
    });
  } catch (error) {
    logger.error('Error en loginAdmin: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion'
    });
  }
};

// ============================================
// LOGIN MESERO
// ============================================
exports.loginMesero = async (req, res) => {
  try {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Intento mesero con DNI invalido: ' + (dni || 'vacio'),
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI invalido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Login mesero fallido con DNI: ' + dni,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI invalido o incorrecto'
      });
    }

    if (usuario.rol !== 'mesero') {
      await logActividad({
        usuario_id: usuario.id,
        tipo_usuario: 'usuario',
        accion: 'login_fallido',
        descripcion: 'Rol ' + usuario.rol + ' intento login mesero',
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
      descripcion: 'Login mesero: ' + usuario.nombre,
      ...getMeta(req)
    });

    delete usuario.password;

    res.json({
      success: true,
      ...usuario,
      token
    });
  } catch (error) {
    logger.error('Error en loginMesero: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion'
    });
  }
};

// ============================================
// LOGIN GENERAL
// ============================================
exports.login = async (req, res) => {
  try {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Intento con DNI invalido: ' + (dni || 'vacio'),
        ...getMeta(req)
      });
      return res.status(400).json({
        success: false,
        message: 'DNI invalido o incorrecto'
      });
    }

    const usuario = await Usuario.findByDni(dni);

    if (!usuario || !usuario.activo) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Login fallido con DNI: ' + dni,
        ...getMeta(req)
      });
      return res.status(401).json({
        success: false,
        message: 'DNI invalido o incorrecto'
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
      descripcion: 'Login: ' + usuario.nombre + ' (' + usuario.rol + ')',
      ...getMeta(req)
    });

    delete usuario.password;

    res.json({
      success: true,
      ...usuario,
      token
    });
  } catch (error) {
    logger.error('Error en login: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion'
    });
  }
};

// ============================================
// LOGIN CLIENTE
// ============================================
exports.loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contrasena son obligatorios'
      });
    }

    const cliente = await Cliente.findByEmail(email);

    if (!cliente) {
      await logActividad({
        tipo_usuario: 'anonimo',
        accion: 'login_fallido',
        descripcion: 'Login cliente fallido (email no existe): ' + email,
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
        descripcion: 'Cuenta desactivada: ' + email,
        ...getMeta(req)
      });
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta con soporte.'
      });
    }

    if (!cliente.email_verificado) {
      return res.status(403).json({
        success: false,
        requiereVerificacion: true,
        message: 'Debes verificar tu correo. Revisa tu bandeja o solicita un nuevo codigo.'
      });
    }

    const passwordValida = await bcrypt.compare(password, cliente.password);

    if (!passwordValida) {
      await logActividad({
        cliente_id: cliente.id,
        tipo_usuario: 'cliente',
        accion: 'login_fallido',
        descripcion: 'Contrasena incorrecta para ' + email,
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
      descripcion: 'Login cliente: ' + email,
      ...getMeta(req)
    });

    const { password: _, ...clienteData } = cliente;

    res.json({
      success: true,
      cliente: clienteData,
      token
    });
  } catch (error) {
    logger.error('Error en loginCliente: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion'
    });
  }
};

// ============================================
// REGISTRO CLIENTE (envia codigo al correo)
// ============================================
exports.registerCliente = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contrasena son obligatorios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena debe tener al menos 6 caracteres'
      });
    }

    const existente = await Cliente.findByEmail(email);

    if (existente) {
      // Si existe pero no esta verificado, reenviamos codigo
      if (!existente.email_verificado) {
        const codigo = generarCodigo();
        await Cliente.guardarCodigoVerificacion(existente.id, codigo);

        try {
          await emailService.enviarCodigoVerificacion({
            to: email,
            nombre: existente.nombre,
            codigo
          });
        } catch (mailErr) {
          logger.error('Error enviando correo (reenvio): ' + mailErr.message);
          return res.status(500).json({
            success: false,
            message: 'No se pudo enviar el correo. Intenta de nuevo.'
          });
        }

        return res.status(200).json({
          success: true,
          requiereVerificacion: true,
          message: 'Te reenviamos un nuevo codigo a tu correo'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'El correo ya esta registrado'
      });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      email,
      telefono,
      direccion,
      password
    });

    const codigo = generarCodigo();
    await Cliente.guardarCodigoVerificacion(nuevoCliente.id, codigo);

    try {
      await emailService.enviarCodigoVerificacion({
        to: email,
        nombre,
        codigo
      });
    } catch (mailErr) {
      logger.error('Error enviando codigo de verificacion: ' + mailErr.message);
      return res.status(500).json({
        success: false,
        message: 'Cuenta creada pero no se pudo enviar el correo. Reintenta el reenvio.'
      });
    }

    await logActividad({
      cliente_id: nuevoCliente.id,
      tipo_usuario: 'cliente',
      accion: 'registro_pendiente_verificacion',
      descripcion: 'Registro iniciado (sin verificar): ' + email,
      datos: { telefono, direccion },
      ...getMeta(req)
    });

    res.status(201).json({
      success: true,
      requiereVerificacion: true,
      message: 'Codigo enviado. Revisa tu correo.'
    });
  } catch (error) {
    logger.error('Error en registerCliente: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente'
    });
  }
};

// ============================================
// VERIFICAR CODIGO
// ============================================
exports.verificarCodigoCliente = async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Correo y codigo son obligatorios'
      });
    }

    const resultado = await Cliente.verificarCodigo(email, codigo);

    if (!resultado.ok) {
      const mensajes = {
        cliente_no_existe: 'Cliente no encontrado',
        sin_codigo: 'No hay codigo pendiente. Solicita uno nuevo.',
        codigo_incorrecto: 'Codigo incorrecto',
        codigo_expirado: 'El codigo expiro. Solicita uno nuevo.'
      };
      return res.status(400).json({
        success: false,
        message: mensajes[resultado.motivo] || 'No se pudo verificar el codigo'
      });
    }

    const cliente = await Cliente.findById(resultado.clienteId);
    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, tipo: 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await Cliente.updateUltimoAcceso(cliente.id);

    await logActividad({
      cliente_id: cliente.id,
      tipo_usuario: 'cliente',
      accion: 'email_verificado',
      descripcion: 'Correo verificado: ' + email,
      ...getMeta(req)
    });

    res.json({
      success: true,
      cliente,
      token,
      message: 'Correo verificado. Bienvenido.'
    });
  } catch (error) {
    logger.error('Error en verificarCodigoCliente: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el codigo'
    });
  }
};

// ============================================
// REENVIAR CODIGO
// ============================================
exports.reenviarCodigo = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Correo requerido'
      });
    }

    const cliente = await Cliente.findByEmail(email);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    if (cliente.email_verificado) {
      return res.status(400).json({
        success: false,
        message: 'Este correo ya esta verificado'
      });
    }

    const codigo = generarCodigo();
    await Cliente.guardarCodigoVerificacion(cliente.id, codigo);

    await emailService.enviarCodigoVerificacion({
      to: email,
      nombre: cliente.nombre,
      codigo
    });

    res.json({
      success: true,
      message: 'Nuevo codigo enviado'
    });
  } catch (error) {
    logger.error('Error en reenviarCodigo: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar codigo'
    });
  }
};