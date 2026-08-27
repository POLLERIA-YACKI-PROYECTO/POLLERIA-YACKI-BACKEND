// controllers/cliente.controller.js
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

// Crear cliente
exports.create = async (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, email, direccion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (dni) {
      const existe = await Cliente.findByDni(dni);
      if (existe) {
        return res.status(400).json({ error: 'El DNI ya está registrado' });
      }
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      apellido: apellido || null,
      dni: dni || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null
    });

    res.status(201).json({
      message: 'Cliente creado correctamente',
      cliente: nuevoCliente
    });
  } catch (error) {
    console.error('Error en create cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
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

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const actualizado = await Cliente.update(id, {
      nombre,
      apellido: apellido || null,
      dni: dni || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null
    });

    if (actualizado) {
      const clienteActualizado = await Cliente.findById(id);
      res.json({
        message: 'Cliente actualizado correctamente',
        cliente: clienteActualizado
      });
    } else {
      res.status(400).json({ error: 'No se pudo actualizar el cliente' });
    }
  } catch (error) {
    console.error('Error en update cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

// Eliminar cliente
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const eliminado = await Cliente.delete(id);
    if (eliminado) {
      res.json({ message: 'Cliente eliminado correctamente' });
    } else {
      res.status(400).json({ error: 'No se pudo eliminar el cliente' });
    }
  } catch (error) {
    console.error('Error en delete cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};