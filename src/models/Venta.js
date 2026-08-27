// models/Venta.js
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
        cliente_nombre || null,
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
      WHERE v.id = ?
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
      WHERE v.usuario_id = ?
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
      WHERE v.tipo_entrega = ?
      ORDER BY v.id DESC
    `, [tipo_entrega]);
    return rows;
  }

  static async getResumenPorUsuario(usuarioId) {
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
    return rows[0] || { total_ventas: 0, total_recaudado: 0 };
  }
}

module.exports = Venta;