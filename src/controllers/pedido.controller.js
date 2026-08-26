// src/controllers/pedido.controller.js
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
    const { 
      mesa_id, 
      items, 
      total, 
      cliente_nombre,
      cliente_id,
      tipo,
      observaciones
    } = req.body;
    
    const usuario_id = req.userId;
    
    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    let subtotal = 0;
    items.forEach(item => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : item.precio;
      const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad) : item.cantidad;
      subtotal += precio * cantidad;
    });
    const igv = subtotal * 0.18;
    const totalFinal = total || (subtotal + igv);

    const nuevoPedido = await Pedido.create({
      mesa_id,
      usuario_id,
      items,
      subtotal,
      igv,
      total: totalFinal,
      cliente_nombre: cliente_nombre || null,
      cliente_id: cliente_id || null,
      tipo: tipo || 'local',
      estado: 'pendiente',
      observaciones: observaciones || null
    });

    const pedidoCompleto = await Pedido.findById(nuevoPedido.id);
    if (pedidoCompleto && typeof pedidoCompleto.items === 'string') {
      pedidoCompleto.items = JSON.parse(pedidoCompleto.items);
    }

    res.status(201).json({
      message: 'Pedido creado correctamente',
      pedido: pedidoCompleto || nuevoPedido
    });
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ 
      error: 'Error al crear pedido',
      detalle: error.message 
    });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const actualizado = await Pedido.updateEstado(id, estado);
    if (actualizado) {
      const pedido = await Pedido.findById(id);
      if (pedido && typeof pedido.items === 'string') {
        pedido.items = JSON.parse(pedido.items);
      }
      res.json({
        message: 'Estado actualizado correctamente',
        pedido
      });
    } else {
      res.status(404).json({ error: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// ✅ NUEVO: Marcar pedido como pagado
exports.marcarPagado = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado === 'entregado') {
      return res.status(400).json({ error: 'El pedido ya está pagado' });
    }

    const actualizado = await Pedido.marcarPagado(id);
    if (actualizado) {
      const pedidoActualizado = await Pedido.findById(id);
      if (pedidoActualizado && typeof pedidoActualizado.items === 'string') {
        pedidoActualizado.items = JSON.parse(pedidoActualizado.items);
      }
      res.json({
        message: 'Pedido marcado como pagado correctamente',
        pedido: pedidoActualizado
      });
    } else {
      res.status(400).json({ error: 'No se pudo marcar el pedido como pagado' });
    }
  } catch (error) {
    console.error('Error en marcarPagado:', error);
    res.status(500).json({ error: 'Error al marcar pedido como pagado' });
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

// ✅ NUEVO: Obtener pedidos pendientes
exports.getPendientes = async (req, res) => {
  try {
    const pedidos = await Pedido.findPendientes();
    pedidos.forEach(p => {
      if (typeof p.items === 'string') p.items = JSON.parse(p.items);
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};