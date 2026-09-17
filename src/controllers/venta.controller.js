// src/controllers/venta.controller.js
const Venta = require('../models/Venta');
const db = require('../config/database');

// ============================================
// GET ALL - Combina ventas + pedidos web SIN duplicados
// ============================================
exports.getAll = async (req, res) => {
  try {
    // 1. TODAS las ventas reales (incluye las de origen 'pedido_web')
    const ventas = await Venta.findAll();

    // 2. Pedidos web pagados que AÚN NO tienen venta vinculada
    const pedidosWeb = await Venta.findPedidosClientePagados();

    // 3. Excluir pedidos web cuyo id ya esté vinculado en ventas (doble seguridad)
    const idsVentasWeb = new Set(
      ventas
        .filter(v => v.pedido_cliente_id !== null && v.pedido_cliente_id !== undefined)
        .map(v => Number(v.pedido_cliente_id))
    );

    const pedidosWebFiltrados = (pedidosWeb || []).filter(
      p => !idsVentasWeb.has(Number(p.id))
    );

    // 4. Unificar
    const todas = [...ventas, ...pedidosWebFiltrados];

    // 5. Ordenar por fecha (desc)
    todas.sort((a, b) => {
      const fechaA = new Date(a.fecha_venta || a.created_at || 0).getTime();
      const fechaB = new Date(b.fecha_venta || b.created_at || 0).getTime();
      return fechaB - fechaA;
    });

    // 6. Parsear items y normalizar campos
    todas.forEach(v => {
      if (typeof v.items === 'string') {
        try { v.items = JSON.parse(v.items); }
        catch { v.items = []; }
      }
      if (!Array.isArray(v.items)) v.items = [];

      // Normalizar pedido_cliente_id a number|null
      if (v.pedido_cliente_id === undefined || v.pedido_cliente_id === '') {
        v.pedido_cliente_id = null;
      } else if (v.pedido_cliente_id !== null) {
        v.pedido_cliente_id = Number(v.pedido_cliente_id);
      }

      // Garantizar fecha_venta para el frontend
      if (!v.fecha_venta) {
        v.fecha_venta = v.fecha_confirmacion || v.created_at || null;
      }
    });

    console.log(`[ventas.getAll] devueltas: ${todas.length} (ventas=${ventas.length}, pedidosWebSinVenta=${pedidosWebFiltrados.length})`);

    res.json(todas);
  } catch (error) {
    console.error('Error en getAll ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

// ============================================
// Pedidos web pendientes
// ============================================
exports.getPedidosWebPendientes = async (req, res) => {
  try {
    const pedidos = await Venta.findPedidosClientePendientes();

    pedidos.forEach(v => {
      if (typeof v.items === 'string') {
        try { v.items = JSON.parse(v.items); }
        catch { v.items = []; }
      }
      if (!Array.isArray(v.items)) v.items = [];
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPedidosWebPendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos web pendientes' });
  }
};

// ============================================
// GET BY ID
// ============================================
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
      WHERE usuario_id = ? AND estado = 'completada' AND deleted_at IS NULL
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
      WHERE estado = 'completada' AND deleted_at IS NULL
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