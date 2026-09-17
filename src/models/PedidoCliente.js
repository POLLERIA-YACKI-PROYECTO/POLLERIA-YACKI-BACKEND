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

  // ============================================
  // VALIDAR cliente_id
  // ============================================
  /**
   * Verifica que el cliente_id exista en la BD.
   * Si no existe o es inválido, devuelve null.
   */
  static async validarClienteId(clienteId) {
    if (clienteId === null || clienteId === undefined || clienteId === '') {
      return null;
    }

    const idNum = Number(clienteId);

    if (!Number.isFinite(idNum) || idNum <= 0) {
      console.warn(`cliente_id inválido: "${clienteId}" -> se usará NULL`);
      return null;
    }

    try {
      const [rows] = await db.query(
        'SELECT id FROM clientes WHERE id = ? AND deleted_at IS NULL LIMIT 1',
        [idNum]
      );

      if (rows.length > 0) {
        return idNum;
      }

      console.warn(`Cliente con ID ${idNum} no existe en la BD -> se usará NULL`);
      return null;
    } catch (err) {
      console.error('Error al validar cliente_id:', err.message);
      return null;
    }
  }

  // ============================================
  // FIND ALL
  // ============================================
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

  // ============================================
  // FIND BY ID
  // ============================================
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

  // ============================================
  // FIND BY CLIENTE ID
  // ============================================
  static async findByClienteId(clienteId) {
    const [rows] = await db.query(
      `SELECT * FROM pedidos_cliente
       WHERE cliente_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [clienteId]
    );
    return rows.map(this.parseItems);
  }

  // ============================================
  // FIND PENDIENTES
  // ============================================
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

  // ============================================
  // CREATE (con validación de cliente_id)
  // ============================================
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

    // VALIDAR cliente_id: si no existe, se guarda como NULL
    const clienteIdFinal = await this.validarClienteId(cliente_id);

    // VALIDAR items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('El pedido debe tener al menos un producto');
    }

    // VALIDAR datos mínimos
    if (!cliente_nombre || !String(cliente_nombre).trim()) {
      throw new Error('El nombre del cliente es requerido');
    }

    if (!metodo_pago) {
      throw new Error('El método de pago es requerido');
    }

    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      throw new Error('El total del pedido es inválido');
    }

    const [result] = await db.query(
      `INSERT INTO pedidos_cliente
        (cliente_id, cliente_nombre, cliente_telefono, cliente_direccion,
         cliente_referencia, items, subtotal, igv, total, tipo_entrega,
         metodo_pago, tipo_transferencia, numero_operacion, observaciones, estado, pagado)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', FALSE)`,
      [
        clienteIdFinal,
        String(cliente_nombre).trim(),
        cliente_telefono ? String(cliente_telefono).trim() : null,
        cliente_direccion ? String(cliente_direccion).trim() : null,
        cliente_referencia ? String(cliente_referencia).trim() : null,
        JSON.stringify(items),
        Number(subtotal) || 0,
        Number(igv) || 0,
        totalNum,
        tipo_entrega || 'delivery',
        metodo_pago,
        tipo_transferencia || null,
        numero_operacion || null,
        observaciones || null
      ]
    );

    console.log(`Pedido cliente #${result.insertId} creado (cliente_id: ${clienteIdFinal ?? 'NULL'})`);

    return this.findById(result.insertId);
  }

  // ============================================
  // GUARDAR COMPROBANTE
  // ============================================
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

  // ============================================
  // CONFIRMAR PAGO (admin)
  // ============================================
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

  // ============================================
  // VINCULAR VENTA
  // ============================================
  static async vincularVenta(pedidoId, ventaId) {
    await db.query(
      `UPDATE pedidos_cliente SET venta_id = ? WHERE id = ?`,
      [ventaId, pedidoId]
    );
  }

  // ============================================
  // ACTUALIZAR TIPO DE ENTREGA
  // ============================================
  static async actualizarTipoEntrega(id, tipoEntrega) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET tipo_entrega = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [tipoEntrega, id]
    );
    return result.affectedRows > 0;
  }

  // ============================================
  // RECHAZAR PAGO
  // ============================================
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

  // ============================================
  // UPDATE ESTADO
  // ============================================
  static async updateEstado(id, estado) {
    const [result] = await db.query(
      `UPDATE pedidos_cliente
       SET estado = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  // ============================================
  // DELETE (soft)
  // ============================================
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