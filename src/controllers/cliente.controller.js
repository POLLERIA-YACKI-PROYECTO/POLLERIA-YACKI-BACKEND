// src/controllers/cliente.controller.js
const Cliente = require('../models/Cliente');

// Obtener todos los clientes
exports.getAll = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    console.error('Error en getAll clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

// Buscar clientes por término
exports.buscar = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const clientes = await Cliente.buscar(q);
    res.json(clientes);
  } catch (error) {
    console.error('Error en buscar clientes:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
};

// Obtener cliente por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

// CREAR CLIENTE - CORREGIDO
exports.create = async (req, res) => {
  try {
    console.log('=== CREANDO CLIENTE ===');
    console.log('Body recibido:', req.body);
    
    const { nombre, apellido, dni, telefono, email, direccion } = req.body;
    
    // Validar que el nombre existe
    if (!nombre || nombre.trim() === '') {
      console.log('Nombre es requerido');
      return res.status(400).json({ 
        success: false,
        error: 'El nombre es requerido' 
      });
    }

    // Validar DNI (si se proporciona, debe tener 8 dígitos)
    if (dni && dni.trim() !== '') {
      const dniLimpio = dni.trim();
      if (!/^[0-9]{8}$/.test(dniLimpio)) {
        console.log('DNI inválido:', dniLimpio);
        return res.status(400).json({ 
          success: false,
          error: 'El DNI debe tener 8 dígitos' 
        });
      }
      
      // Verificar si el DNI ya existe
      const existe = await Cliente.findByDni(dniLimpio);
      if (existe) {
        console.log('DNI ya registrado:', dniLimpio);
        return res.status(400).json({ 
          success: false,
          error: 'El DNI ya está registrado' 
        });
      }
    }

    // Crear el cliente
    const nuevoCliente = await Cliente.create({
      nombre: nombre.trim(),
      apellido: apellido ? apellido.trim() : null,
      dni: dni && dni.trim() !== '' ? dni.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      email: email ? email.trim() : null,
      direccion: direccion ? direccion.trim() : null
    });

    console.log('Cliente creado:', nuevoCliente);

    res.status(201).json({
      success: true,
      message: 'Cliente creado correctamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    console.error('Error en create cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear cliente',
      detalle: error.message 
    });
  }
};

// Actualizar cliente
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, telefono, email, direccion } = req.body;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Validar nombre
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'El nombre es requerido' 
      });
    }

    // Validar DNI si se proporciona
    if (dni && dni.trim() !== '') {
      const dniLimpio = dni.trim();
      if (!/^[0-9]{8}$/.test(dniLimpio)) {
        return res.status(400).json({ 
          success: false,
          error: 'El DNI debe tener 8 dígitos' 
        });
      }
      
      const existe = await Cliente.findByDni(dniLimpio);
      if (existe && existe.id !== parseInt(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'El DNI ya está registrado por otro cliente' 
        });
      }
    }

    const actualizado = await Cliente.update(id, {
      nombre: nombre.trim(),
      apellido: apellido ? apellido.trim() : null,
      dni: dni && dni.trim() !== '' ? dni.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      email: email ? email.trim() : null,
      direccion: direccion ? direccion.trim() : null
    });

    if (actualizado) {
      const clienteActualizado = await Cliente.findById(id);
      res.json({
        success: true,
        message: 'Cliente actualizado correctamente',
        cliente: clienteActualizado
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'No se pudo actualizar el cliente' 
      });
    }
  } catch (error) {
    console.error('Error en update cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar cliente' 
    });
  }
};

// Eliminar cliente
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ 
        success: false,
        error: 'Cliente no encontrado' 
      });
    }

    const eliminado = await Cliente.delete(id);
    if (eliminado) {
      res.json({ 
        success: true,
        message: 'Cliente eliminado correctamente' 
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'No se pudo eliminar el cliente' 
      });
    }
  } catch (error) {
    console.error('Error en delete cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar cliente' 
    });
  }
};