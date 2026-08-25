const Pedido = require('../models/Pedido');

exports.getAll = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll();
    pedidos.forEach(p => {
      if (typeof p.items === 'string') p.items = JSON.parse(p.items);
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getAll pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (typeof pedido.items === 'string') pedido.items = JSON.parse(pedido.items);
    res.json(pedido);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

exports.create = async (req, res) => {
  try {
    const { mesa_id, items, total, cliente, tipo } = req.body;
    const usuario_id = req.userId;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }
    const nuevoPedido = await Pedido.create({ mesa_id, usuario_id, items, total, cliente, tipo });
    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const actualizado = await Pedido.updateEstado(id, estado);
    if (actualizado) {
      const pedido = await Pedido.findById(id);
      res.json(pedido);
    } else {
      res.status(404).json({ error: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Pedido.delete(id);
    if (eliminado) {
      res.json({ message: 'Pedido eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
};