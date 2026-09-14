// src/models/PedidoCliente.js
const db = require('../config/database');

class PedidoCliente {
  static parseItems(row) {
    if (!row) return row;
    if (typeof row.items === 'string') {
      try {
        row.items = JSON.parse(row.items);
      } catch {
        row.items = [];
      }
    }
    if (!Array.isArray(row.items)) row.items = [];
    return row;
  }

  static async findAll() {
    const [rows] = await db.query(
      `SELECT pc.*, 
              c.nombre AS cliente_nombre_real,
              c.apellido AS cliente_apellido_real,
              c.dni AS cliente_dni,
              c.email AS cliente_email
       FROM pedidos_cliente pc
       LEFT JOIN clientes c ON pc.cliente_id = c.id
       WHERE pc.deleted_at IS NULL
       ORDER BY pc.created_at DESC`
    );
    return rows.map(this.parseItems);
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT pc.*, 
              c.nombre AS cliente_nombre_real,
              c.apellido AS cliente_apellido_real,
              c.dni AS cliente_dni,
              c.email AS cliente_email
       FROM pedidos_cliente pc
       LEFT JOIN clientes c ON pc.cliente_id = c.id
       WHERE pc.id = ? AND pc.deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? this.parseItems(rows[0]) : null;
  }

  static async findByClienteId(clienteId) {
    const [rows] = await db.query(
      `SELECT * FROM pedidos_cliente
       WHERE cliente_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [clienteId]
    );
    return rows.map(this.parseItems);
  }

  static async findPendientes() {
    const [rows] = await db.query(
      `SELECT pc.*, 
              c.nombre AS cliente_nombre_real,
              c.apellido AS cliente_apellido_real,
              c.dni AS cliente_dni
       FROM pedidos_cliente pc
       LEFT JOIN clientes c ON pc.cliente_id = c.id
       WHERE pc.deleted_at IS NULL
         AND pc.pagado = FALSE
         AND pc.estado NOT IN ('cancelado', 'entregado')
       ORDER BY pc.created_at ASC`
    );
    return rows.map(this.parseItems);
  }

  static async create(pedido) {
    const {
      cliente_id,
      cliente_nombre,
      cliente_telefono,
      cliente_direccion,
      cliente_referencia,
      items,
      subtotal,
      igv,
      total,
      tipo_entrega,
      metodo_pago,
      tipo_transferencia,
      numero_operacion,
      observaciones
    } = pedido;

    const [result] = await db.query(
      `INSERT INTO pedidos_cliente
        (cliente_id, cliente_nombre, cliente_telefono, cliente_direccion,
         cliente_referencia, items, subtotal, igv, total, tipo_entrega,
         metodo_pago, tipo_transferencia, numero_operacion, observaciones, estado, pagado)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', FALSE)`,
      [
        cliente_id || null,
        cliente_nombre,
        cliente_telefono || null,
        cliente_direccion || null,
        cliente_referencia || null,
        JSON.stringify(items),
        subtotal,
        igv,
        total,
        tipo_entrega || 'delivery',
        metodo_pago,
        tipo_transferencia || null,
        numero_operacion || null,
        observaciones || null
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * ✅ Guardar comprobante de pago
   */
  static async guardarComprobante(id, rutaComprobante) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET comprobante_pago = ?,
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [rutaComprobante, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * ✅ Confirmar pago (admin) - solo marca como pagado, la venta se crea en el controller
   */
  static async confirmarPago(id, confirmadoPor) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET pagado = TRUE,
           estado = 'preparando',
           confirmado_por = ?,
           fecha_confirmacion = NOW(),
           fecha_pago = NOW(),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL AND pagado = FALSE`,
      [confirmadoPor, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * ✅ Vincular venta creada
   */
  static async vincularVenta(pedidoId, ventaId) {
    await db.query(
      `UPDATE pedidos_cliente SET venta_id = ? WHERE id = ?`,
      [ventaId, pedidoId]
    );
  }

  /**
   * ✅ Actualizar tipo de entrega (admin)
   */
  static async actualizarTipoEntrega(id, tipoEntrega) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET tipo_entrega = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [tipoEntrega, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * ✅ Rechazar pago (admin)
   */
  static async rechazarPago(id, motivo, confirmadoPor) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET estado = 'cancelado',
           confirmado_por = ?,
           fecha_confirmacion = NOW(),
           motivo_rechazo = ?,
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL AND pagado = FALSE`,
      [confirmadoPor, motivo || 'Pago no verificado', id]
    );
    return result.affectedRows > 0;
  }

  static async updateEstado(id, estado) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET estado = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET deleted_at = NOW()
       WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = PedidoCliente;