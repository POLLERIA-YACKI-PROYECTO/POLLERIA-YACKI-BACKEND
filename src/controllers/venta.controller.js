const Venta = require('../models/Venta');
const Mesa = require('../models/Mesa');
const Pedido = require('../models/Pedido');

exports.getAll = async (req, res) => {
  try {
    const ventas = await Venta.findAll();
    ventas.forEach(v => {
      if (typeof v.items === 'string') v.items = JSON.parse(v.items);
    });
    res.json(ventas);
  } catch (error) {
    console.error('Error en getAll ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (typeof venta.items === 'string') venta.items = JSON.parse(venta.items);
    res.json(venta);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

exports.getByFecha = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fecha inicio y fin son requeridas' });
    }
    const ventas = await Venta.findByFecha(fechaInicio, fechaFin);
    ventas.forEach(v => {
      if (typeof v.items === 'string') v.items = JSON.parse(v.items);
    });
    res.json(ventas);
  } catch (error) {
    console.error('Error en getByFecha:', error);
    res.status(500).json({ error: 'Error al obtener ventas por fecha' });
  }
};

exports.create = async (req, res) => {
  try {
    const { items, total, metodo_pago, cliente, mesa_id, tipo, pedido_id } = req.body;
    const usuario_id = req.userId;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un item' });
    }
    if (!metodo_pago) {
      return res.status(400).json({ error: 'Método de pago es requerido' });
    }
    const nuevaVenta = await Venta.create({ usuario_id, items, total, metodo_pago, cliente, mesa_id, tipo });
    if (mesa_id) {
      await Mesa.liberarMesa(mesa_id);
    }
    if (pedido_id) {
      await Pedido.updateEstado(pedido_id, 'entregado');
    }
    res.status(201).json(nuevaVenta);
  } catch (error) {
    console.error('Error en create venta:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
};

exports.getResumenDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha es requerida' });
    }
    const resumen = await Venta.getResumenDiario(fecha);
    res.json(resumen);
  } catch (error) {
    console.error('Error en getResumenDiario:', error);
    res.status(500).json({ error: 'Error al obtener resumen diario' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Venta.delete(id);
    if (eliminado) {
      res.json({ message: 'Venta eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Venta no encontrada' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar venta' });
  }
};