// models/Pedido.js - COMPLETO Y CORREGIDO
const db = require('../config/database');

class Pedido {
  // ✅ FIND ALL
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

  // ✅ FIND BY ID - CORREGIDO
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

  // ✅ FIND BY USUARIO
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

  // ✅ CREATE - CORREGIDO
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
    
    let itemsJson = '[]';
    
    try {
      if (Array.isArray(items) && items.length > 0) {
        const itemsLimpios = items.map(item => {
          let nombreLimpio = String(item.nombre || '').trim();
          nombreLimpio = nombreLimpio.replace(/[\/\\"]/g, '-');
          
          return {
            id: Number(item.id) || 0,
            nombre: nombreLimpio,
            precio: Number(item.precio) || 0,
            cantidad: Number(item.cantidad) || 0,
            subtotal: Number(item.subtotal) || (Number(item.precio) * Number(item.cantidad))
          };
        });
        
        const itemsString = JSON.stringify(itemsLimpios);
        const parsed = JSON.parse(itemsString);
        itemsJson = JSON.stringify(parsed);
      }
    } catch (error) {
      console.error('❌ Error al procesar items:', error);
      itemsJson = '[]';
    }
    
    console.log('📝 Items JSON final:', itemsJson);
    
    const [result] = await db.query(
      `INSERT INTO pedidos 
       (mesa_id, usuario_id, items, subtotal, igv, total, cliente_nombre, cliente_id, 
        tipo, tipo_entrega, estado, observaciones, metodo_pago, pagado) 
       VALUES (?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesa_id || null, 
        usuario_id, 
        itemsJson, 
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

  // ✅ CREAR VENTA
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
    
    let itemsJson = '[]';
    
    try {
      if (Array.isArray(items) && items.length > 0) {
        const itemsLimpios = items.map(item => ({
          id: Number(item.id) || 0,
          nombre: String(item.nombre || '').trim().replace(/[\/\\"]/g, '-'),
          precio: Number(item.precio) || 0,
          cantidad: Number(item.cantidad) || 0,
          subtotal: Number(item.subtotal) || (Number(item.precio) * Number(item.cantidad))
        }));
        itemsJson = JSON.stringify(itemsLimpios);
      }
    } catch (error) {
      console.error('❌ Error al procesar items para venta:', error);
      itemsJson = '[]';
    }
    
    const [result] = await db.query(
      `INSERT INTO ventas 
       (pedido_id, usuario_id, mesa_id, cliente_id, cliente_nombre, items, subtotal, igv, descuento, total, metodo_pago, numero_operacion, tipo_entrega, estado, observaciones) 
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido_id || null,
        usuario_id,
        mesa_id || null,
        cliente_id || null,
        cliente_nombre || 'Cliente',
        itemsJson,
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

  // ✅ ACTUALIZAR ESTADO
  static async updateEstado(id, estado) {
    const [result] = await db.query(
      'UPDATE pedidos SET estado = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [estado, id]
    );
    return result.affectedRows > 0;
  }

  // ✅ MARCAR PAGADO
  static async marcarPagado(id, metodo_pago) {
    const [result] = await db.query(
      `UPDATE pedidos 
       SET pagado = 1, 
           metodo_pago = ?,
           fecha_pago = NOW(),
           updated_at = NOW() 
       WHERE id = ? AND deleted_at IS NULL`,
      [metodo_pago, id]
    );
    return result.affectedRows > 0;
  }

  // ✅ ELIMINAR (SOFT DELETE)
  static async delete(id) {
    const [result] = await db.query(
      'UPDATE pedidos SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // ✅ FIND PENDIENTES
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

  // ✅ FIND PAGADOS
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

  // ✅ FIND BY TIPO ENTREGA
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

  // ✅ FIND ENTREGADOS POR USUARIO
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