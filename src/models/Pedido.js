// models/Pedido.js
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
      WHERE p.deleted_at IS NULL
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
      WHERE p.id = ? AND p.deleted_at IS NULL
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
      tipo_entrega,
      estado,
      observaciones,
      metodo_pago,
      pagado
    } = pedido;
    
    const [result] = await db.query(
      `INSERT INTO pedidos 
       (mesa_id, usuario_id, items, subtotal, igv, total, cliente_nombre, cliente_id, 
        tipo, tipo_entrega, estado, observaciones, metodo_pago, pagado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesa_id || null, 
        usuario_id, 
        JSON.stringify(items), 
        subtotal || 0,
        igv || 0,
        total, 
        cliente_nombre || 'Cliente', 
        cliente_id || null,
        tipo || 'local',
        tipo_entrega || 'local',
        estado || 'pendiente',
        observaciones || null,
        metodo_pago || null,
        pagado || 0
      ]
    );
    return { id: result.insertId, ...pedido };
  }

  static async crearVenta(venta) {
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

  static async updateEstado(id, estado) {
    const [result] = await db.query(
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ?',
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  static async update(id, pedido) {
    const { mesa_id, items, subtotal, igv, total, cliente_nombre, cliente_id, tipo, tipo_entrega, observaciones, estado } = pedido;
    const [result] = await db.query(
      `UPDATE pedidos 
       SET mesa_id = ?, items = ?, subtotal = ?, igv = ?, total = ?, 
           cliente_nombre = ?, cliente_id = ?, tipo = ?, tipo_entrega = ?, observaciones = ?, estado = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        mesa_id || null, 
        JSON.stringify(items), 
        subtotal || 0,
        igv || 0,
        total, 
        cliente_nombre || 'Cliente', 
        cliente_id || null,
        tipo || 'local',
        tipo_entrega || 'local',
        observaciones || null,
        estado || 'pendiente',
        id
      ]
    );
    return result.affectedRows > 0;
  }

  static async marcarPagado(id, metodo_pago) {
    const [result] = await db.query(
      `UPDATE pedidos 
       SET pagado = 1, 
           metodo_pago = ?,
           fecha_pago = NOW(),
           updated_at = NOW() 
       WHERE id = ?`,
      [metodo_pago, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE pedidos SET deleted_at = NOW() WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

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
        AND (p.pagado = 0 OR p.pagado IS NULL)
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  static async findPagados() {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = 'entregado' 
        AND p.pagado = 1
        AND p.deleted_at IS NULL
      ORDER BY p.fecha_pago DESC
    `);
    return rows;
  }

  static async findByTipoEntrega(tipo_entrega) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.tipo_entrega = ? 
        AND p.pagado = 1
        AND p.deleted_at IS NULL
      ORDER BY p.fecha_pago DESC
    `, [tipo_entrega]);
    return rows;
  }

  // ✅ Obtener pedidos por usuario
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
        AND p.deleted_at IS NULL
      ORDER BY p.id DESC
    `, [usuarioId]);
    return rows;
  }

  // Obtener pedidos entregados del mesero
  static async findEntregadosByUsuario(usuarioId) {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.nombre as usuario_nombre, 
             u.rol as usuario_rol,
             c.nombre as cliente_nombre_real
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.estado = 'entregado'
        AND p.usuario_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.fecha_pago DESC, p.created_at DESC
    `, [usuarioId]);
    return rows;
  }
}

module.exports = Pedido;