// src/models/Pedido.js
const db = require('../config/database');

class Pedido {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(pedido) {
    const { 
      mesa_id, 
      usuario_id, 
      items, 
      subtotal,
      igv,
      total, 
      cliente_nombre, 
      cliente_id,
      tipo,
      estado,
      observaciones
    } = pedido;
    
    const [result] = await db.query(
      `INSERT INTO pedidos 
       (mesa_id, usuario_id, items, subtotal, igv, total, cliente_nombre, cliente_id, tipo, estado, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesa_id || null, 
        usuario_id, 
        JSON.stringify(items), 
        subtotal || 0,
        igv || 0,
        total, 
        cliente_nombre || null, 
        cliente_id || null,
        tipo || 'local',
        estado || 'pendiente',
        observaciones || null
      ]
    );
    return { id: result.insertId, ...pedido };
  }

  static async updateEstado(id, estado) {
    const [result] = await db.query(
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ?',
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  static async update(id, pedido) {
    const { mesa_id, items, subtotal, igv, total, cliente_nombre, cliente_id, tipo, observaciones, estado } = pedido;
    const [result] = await db.query(
      `UPDATE pedidos 
       SET mesa_id = ?, items = ?, subtotal = ?, igv = ?, total = ?, 
           cliente_nombre = ?, cliente_id = ?, tipo = ?, observaciones = ?, estado = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        mesa_id || null, 
        JSON.stringify(items), 
        subtotal || 0,
        igv || 0,
        total, 
        cliente_nombre || null, 
        cliente_id || null,
        tipo || 'local',
        observaciones || null,
        estado || 'pendiente',
        id
      ]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM pedidos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async findByFecha(fechaInicio, fechaFin) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE DATE(p.created_at) BETWEEN ? AND ?
      ORDER BY p.created_at DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }

  static async findByEstado(estado) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = ?
      ORDER BY p.created_at DESC
    `, [estado]);
    return rows;
  }

  static async findByUsuario(usuarioId) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.usuario_id = ?
      ORDER BY p.created_at DESC
    `, [usuarioId]);
    return rows;
  }

  // Obtener pedidos pendientes (para el admin)
  static async findPendientes() {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado IN ('pendiente', 'preparando', 'listo')
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  // Marcar pedido como pagado (entregado)
  static async marcarPagado(id) {
    const [result] = await db.query(
      'UPDATE pedidos SET estado = "entregado", updated_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Pedido;