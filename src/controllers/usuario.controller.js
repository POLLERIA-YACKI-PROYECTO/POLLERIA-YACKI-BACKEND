// src/controllers/usuario.controller.js
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
exports.getAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    // Ocultar campos sensibles
    const usuariosSanitizados = usuarios.map(u => {
      delete u.password;
      return u;
    });
    res.json(usuariosSanitizados);
  } catch (error) {
    console.error('Error en getAll usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    delete usuario.password;
    res.json(usuario);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// Crear usuario
exports.create = async (req, res) => {
  try {
    const { nombre, apellido, dni, rol, telefono, email, password, fecha_contratacion, salario } = req.body;
    
    if (!nombre || !dni) {
      return res.status(400).json({ error: 'Nombre y DNI son requeridos' });
    }

    if (dni.length !== 8) {
      return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
    }

    // Verificar si el DNI ya existe
    const existe = await Usuario.findByDni(dni);
    if (existe) {
      return res.status(400).json({ error: 'El DNI ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido: apellido || null,
      dni,
      rol: rol || 'mesero',
      telefono: telefono || null,
      email: email || null,
      password: hashedPassword,
      fecha_contratacion: fecha_contratacion || new Date().toISOString().split('T')[0],
      salario: salario || null
    });

    res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, rol, telefono, email, activo, fecha_contratacion, salario } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el nuevo DNI no esté en uso por otro usuario
    if (dni && dni !== usuario.dni) {
      const existe = await Usuario.findByDni(dni);
      if (existe && existe.id !== parseInt(id)) {
        return res.status(400).json({ error: 'El DNI ya está registrado por otro usuario' });
      }
    }

    const actualizado = await Usuario.update(id, {
      nombre: nombre || usuario.nombre,
      apellido: apellido !== undefined ? apellido : usuario.apellido,
      dni: dni || usuario.dni,
      rol: rol || usuario.rol,
      telefono: telefono !== undefined ? telefono : usuario.telefono,
      email: email !== undefined ? email : usuario.email,
      activo: activo !== undefined ? activo : usuario.activo,
      fecha_contratacion: fecha_contratacion || usuario.fecha_contratacion,
      salario: salario !== undefined ? salario : usuario.salario
    });

    if (actualizado) {
      const usuarioActualizado = await Usuario.findById(id);
      delete usuarioActualizado.password;
      res.json({
        message: 'Usuario actualizado correctamente',
        usuario: usuarioActualizado
      });
    } else {
      res.status(400).json({ error: 'No se pudo actualizar el usuario' });
    }
  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar al admin principal (id 1)
    if (usuario.id === 1) {
      return res.status(400).json({ error: 'No se puede eliminar al administrador principal' });
    }

    const eliminado = await Usuario.delete(id);
    if (eliminado) {
      res.json({ message: 'Usuario eliminado correctamente' });
    } else {
      res.status(400).json({ error: 'No se pudo eliminar el usuario' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};