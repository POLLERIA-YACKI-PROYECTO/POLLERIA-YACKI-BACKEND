// controllers/venta.controller.js
const Venta = require('../models/Venta');

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

exports.getByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const ventas = await Venta.findByUsuario(usuarioId);
    ventas.forEach(v => {
      if (typeof v.items === 'string') v.items = JSON.parse(v.items);
    });
    res.json(ventas);
  } catch (error) {
    console.error('Error en getByUsuario:', error);
    res.status(500).json({ error: 'Error al obtener ventas por usuario' });
  }
};

exports.getByTipoEntrega = async (req, res) => {
  try {
    const { tipo } = req.params;
    const ventas = await Venta.findByTipoEntrega(tipo);
    ventas.forEach(v => {
      if (typeof v.items === 'string') v.items = JSON.parse(v.items);
    });
    res.json(ventas);
  } catch (error) {
    console.error('Error en getByTipoEntrega:', error);
    res.status(500).json({ error: 'Error al obtener ventas por tipo' });
  }
};

exports.getResumenPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_recaudado,
        SUM(CASE WHEN tipo_entrega = 'local' THEN total ELSE 0 END) as total_local,
        SUM(CASE WHEN tipo_entrega = 'delivery' THEN total ELSE 0 END) as total_delivery,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
        SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
        SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
      FROM ventas 
      WHERE usuario_id = ? AND estado = 'completada'
    `, [usuarioId]);
    res.json(rows[0] || { total_ventas: 0, total_recaudado: 0 });
  } catch (error) {
    console.error('Error en getResumenPorUsuario:', error);
    res.status(500).json({ error: 'Error al obtener resumen por usuario' });
  }
};

exports.getResumenGeneral = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_recaudado,
        SUM(CASE WHEN tipo_entrega = 'local' THEN total ELSE 0 END) as total_local,
        SUM(CASE WHEN tipo_entrega = 'delivery' THEN total ELSE 0 END) as total_delivery
      FROM ventas 
      WHERE estado = 'completada'
    `);
    res.json(rows[0] || { total_ventas: 0, total_recaudado: 0 });
  } catch (error) {
    console.error('Error en getResumenGeneral:', error);
    res.status(500).json({ error: 'Error al obtener resumen general' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM ventas WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ message: 'Venta eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Venta no encontrada' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar venta' });
  }
};