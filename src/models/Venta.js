// models/Venta.js
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
      SELECT 
        v.*, 
        u.nombre as usuario_nombre,
        u.rol as usuario_rol,
        c.nombre as cliente_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      ORDER BY v.fecha_venta DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }

  static async create(venta) {
    const { usuario_id, items, total, metodo_pago, cliente_id, mesa_id, tipo_entrega } = venta;
    const [result] = await db.query(
      `INSERT INTO ventas 
       (usuario_id, items, total, metodo_pago, cliente_id, mesa_id, tipo_entrega, fecha_venta) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [usuario_id, JSON.stringify(items), total, metodo_pago, cliente_id || null, mesa_id || null, tipo_entrega || 'local']
    );
    return { id: result.insertId, ...venta };
  }

  static async getResumenDiario(fecha) {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_recaudado,
        AVG(total) as promedio,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
        SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END) as total_yape,
        SUM(CASE WHEN metodo_pago = 'plin' THEN total ELSE 0 END) as total_plin
      FROM ventas 
      WHERE DATE(fecha_venta) = ?
    `, [fecha]);
    return rows[0] || { total_ventas: 0, total_recaudado: 0, promedio: 0 };
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM ventas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Método adicional para ventas por usuario en un día específico
  static async getVentasPorUsuario(fecha) {
    const [rows] = await db.query(`
      SELECT 
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.rol as usuario_rol,
        COUNT(v.id) as cantidad_ventas,
        SUM(v.total) as total_recaudado
      FROM usuarios u
      LEFT JOIN ventas v ON u.id = v.usuario_id AND DATE(v.fecha_venta) = ?
      WHERE u.estado = 1
      GROUP BY u.id, u.nombre, u.rol
      ORDER BY total_recaudado DESC
    `, [fecha]);
    return rows;
  }

  // Método para obtener ventas por cliente
  static async getVentasPorCliente(fechaInicio, fechaFin) {
    const [rows] = await db.query(`
      SELECT 
        c.id as cliente_id,
        c.nombre as cliente_nombre,
        COUNT(v.id) as cantidad_ventas,
        SUM(v.total) as total_gastado
      FROM clientes c
      LEFT JOIN ventas v ON c.id = v.cliente_id AND DATE(v.fecha_venta) BETWEEN ? AND ?
      WHERE c.estado = 1
      GROUP BY c.id, c.nombre
      ORDER BY total_gastado DESC
    `, [fechaInicio, fechaFin]);
    return rows;
  }
}

module.exports = Venta;