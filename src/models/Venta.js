const db = require('../config/database');

class Venta {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT v.*, u.nombre as usuario_nombre 
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT v.*, u.nombre as usuario_nombre 
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?
    `, [id]);
    return rows[0];
  }

  static async findByFecha(fechaInicio, fechaFin) {
    const [rows] = await db.query(`
      SELECT v.*, u.nombre as usuario_nombre 
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE DATE(v.created_at) BETWEEN ? AND ?
      ORDER BY v.created_at DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }

  static async create(venta) {
    const { usuario_id, items, total, metodo_pago, cliente, mesa_id, tipo } = venta;
    const [result] = await db.query(
      'INSERT INTO ventas (usuario_id, items, total, metodo_pago, cliente, mesa_id, tipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, JSON.stringify(items), total, metodo_pago, cliente || null, mesa_id || null, tipo || 'local']
    );
    return { id: result.insertId, ...venta };
  }

  static async getResumenDiario(fecha) {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_recaudado,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
        SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
        SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
      FROM ventas 
      WHERE DATE(created_at) = ?
    `, [fecha]);
    return rows[0];
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM ventas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Venta;