// src/models/Venta.js
const db = require('../config/database');

class Venta {
  static async create(venta) {
    const { 
      pedido_id,
      usuario_id, 
      mesa_id,
      cliente_id,
      cliente_nombre,
      items, 
      subtotal,
      igv,
      descuento,
      total, 
      metodo_pago,
      numero_operacion,
      tipo_entrega,
      estado,
      observaciones
    } = venta;
    
    const [result] = await db.query(
      `INSERT INTO ventas 
       (pedido_id, usuario_id, mesa_id, cliente_id, cliente_nombre, items, subtotal, igv, descuento, total, metodo_pago, numero_operacion, tipo_entrega, estado, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido_id || null,
        usuario_id,
        mesa_id || null,
        cliente_id || null,
        cliente_nombre || 'Cliente',
        JSON.stringify(items),
        subtotal || 0,
        igv || 0,
        descuento || 0,
        total,
        metodo_pago,
        numero_operacion || null,
        tipo_entrega || 'local',
        estado || 'completada',
        observaciones || null
      ]
    );
    return { id: result.insertId, ...venta };
  }

  static async findAll() {
    const [rows] = await db.query(`
      SELECT v.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.deleted_at IS NULL
      ORDER BY v.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT v.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ? AND v.deleted_at IS NULL
    `, [id]);
    return rows[0];
  }

  static async findByUsuario(usuarioId) {
    const [rows] = await db.query(`
      SELECT v.*, 
             u.nombre as usuario_nombre,
             c.nombre as cliente_nombre_real
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.usuario_id = ? AND v.deleted_at IS NULL
      ORDER BY v.id DESC
    `, [usuarioId]);
    return rows;
  }

  static async findByTipoEntrega(tipo_entrega) {
    const [rows] = await db.query(`
      SELECT v.*, 
             u.nombre as usuario_nombre,
             c.nombre as cliente_nombre_real
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.tipo_entrega = ? AND v.deleted_at IS NULL
      ORDER BY v.id DESC
    `, [tipo_entrega]);
    return rows;
  }

  // ✅ Método findByFecha - CORREGIDO
  static async findByFecha(fechaInicio, fechaFin) {
    const [rows] = await db.query(`
      SELECT v.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
        AND v.estado = 'completada'
        AND v.deleted_at IS NULL
      ORDER BY v.fecha_venta DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }

  // ✅ Método getResumenDiario
  static async getResumenDiario(fecha) {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_recaudado,
        AVG(total) as promedio,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
        SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
        SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin,
        SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia
      FROM ventas 
      WHERE DATE(fecha_venta) = ?
        AND estado = 'completada'
        AND deleted_at IS NULL
    `, [fecha]);
    return rows[0] || { total_ventas: 0, total_recaudado: 0, promedio: 0 };
  }

  // ✅ Método getVentasPorCliente
  static async getVentasPorCliente(fechaInicio, fechaFin) {
    const [rows] = await db.query(`
      SELECT 
        v.cliente_id,
        v.cliente_nombre,
        c.nombre as nombre_real,
        COUNT(*) as total_ventas,
        SUM(v.total) as total_gastado,
        AVG(v.total) as promedio,
        MAX(v.total) as compra_maxima,
        MIN(v.total) as compra_minima
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
        AND v.estado = 'completada'
        AND v.deleted_at IS NULL
      GROUP BY v.cliente_id, v.cliente_nombre, c.nombre
      ORDER BY total_gastado DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }
}

module.exports = Venta;