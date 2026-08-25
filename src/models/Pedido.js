const db = require('../config/database');

class Pedido {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, u.nombre as usuario_nombre 
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT p.*, u.nombre as usuario_nombre 
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async create(pedido) {
    const { mesa_id, usuario_id, items, total, cliente, tipo } = pedido;
    const [result] = await db.query(
      'INSERT INTO pedidos (mesa_id, usuario_id, items, total, cliente, tipo) VALUES (?, ?, ?, ?, ?, ?)',
      [mesa_id || null, usuario_id, JSON.stringify(items), total, cliente || null, tipo || 'local']
    );
    return { id: result.insertId, ...pedido };
  }

  static async updateEstado(id, estado) {
    const [result] = await db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM pedidos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Pedido;