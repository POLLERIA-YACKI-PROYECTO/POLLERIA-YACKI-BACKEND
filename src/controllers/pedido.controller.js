// src/controllers/pedido.controller.js
const Pedido = require('../models/Pedido');
const db = require('../config/database');

// ============================================
// OBTENER TODOS LOS PEDIDOS
// ============================================
exports.getAll = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const userRol = req.userRol;
    
    console.log('📝 === OBTENIENDO PEDIDOS ===');
    console.log('📝 Usuario ID:', usuarioId);
    console.log('📝 Rol:', userRol);
    
    let pedidos;
    
    if (userRol === 'admin' || userRol === 'cajero') {
      pedidos = await Pedido.findAll();
    } else {
      pedidos = await Pedido.findByUsuario(usuarioId);
    }
    
    pedidos.forEach(p => {
      if (typeof p.items === 'string') p.items = JSON.parse(p.items);
    });
    
    console.log(`✅ ${pedidos.length} pedidos encontrados`);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getAll pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// ============================================
// OBTENER PEDIDO POR ID
// ============================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (typeof pedido.items === 'string') pedido.items = JSON.parse(pedido.items);
    res.json(pedido);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// ============================================
// ✅ CREAR PEDIDO
// ============================================
exports.create = async (req, res) => {
  try {
    console.log('📝 === CREANDO PEDIDO ===');
    console.log('📝 Body:', req.body);
    console.log('📝 Usuario ID:', req.userId);

    const { 
      mesa_id,
      items, 
      total, 
      cliente_nombre,
      cliente_id,
      tipo,
      tipo_entrega,
      observaciones,
      metodo_pago,
      pagado
    } = req.body;
    
    const usuario_id = req.userId;
    
    if (!usuario_id) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!items || items.length === 0) {
      console.log('❌ El pedido debe tener al menos un item');
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    // Calcular subtotal
    let subtotal = 0;
    items.forEach(item => {
      const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : item.precio;
      const cantidad = typeof item.cantidad === 'string' ? parseInt(item.cantidad) : item.cantidad;
      subtotal += precio * cantidad;
    });
    
    const igv = subtotal * 0.18;
    const totalFinal = total || (subtotal + igv);

    console.log('📝 Subtotal:', subtotal);
    console.log('📝 IGV:', igv);
    console.log('📝 Total:', totalFinal);

    // Crear el pedido
    const nuevoPedido = await Pedido.create({
      usuario_id,
      mesa_id: mesa_id || null,
      items,
      subtotal,
      igv,
      total: totalFinal,
      cliente_nombre: cliente_nombre || 'Cliente',
      cliente_id: cliente_id || null,
      tipo: tipo || 'local',
      tipo_entrega: tipo_entrega || 'local',
      estado: 'pendiente',
      observaciones: observaciones || null,
      metodo_pago: metodo_pago || null,
      pagado: pagado || 0
    });

    console.log('✅ Pedido creado con ID:', nuevoPedido.id);

    // Obtener el pedido completo
    const pedidoCompleto = await Pedido.findById(nuevoPedido.id);
    if (pedidoCompleto && typeof pedidoCompleto.items === 'string') {
      pedidoCompleto.items = JSON.parse(pedidoCompleto.items);
    }

    // Si el pedido ya está pagado, marcar como pagado y crear venta
    if (pagado === true || pagado === 1) {
      console.log('📝 Pedido marcado como pagado directamente');
      
      await Pedido.updateEstado(nuevoPedido.id, 'entregado');
      
      const ventaData = {
        pedido_id: nuevoPedido.id,
        usuario_id: usuario_id,
        cliente_nombre: cliente_nombre || 'Cliente',
        cliente_id: cliente_id || null,
        items: items,
        subtotal: subtotal,
        igv: igv,
        total: totalFinal,
        metodo_pago: metodo_pago || 'efectivo',
        tipo_entrega: tipo_entrega || 'local',
        estado: 'completada',
        observaciones: observaciones || null
      };

      await Pedido.crearVenta(ventaData);
      await Pedido.marcarPagado(nuevoPedido.id, metodo_pago || 'efectivo');
    }

    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      pedido: pedidoCompleto || nuevoPedido
    });

  } catch (error) {
    console.error('❌ Error en create:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear pedido',
      detalle: error.message 
    });
  }
};

// ============================================
// ✅ MARCAR PEDIDO COMO PAGADO
// ============================================
exports.marcarPagado = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_pago } = req.body;
    
    console.log('📝 === MARCANDO PAGO ===');
    console.log('📝 Pedido ID:', id);
    console.log('📝 Método de pago:', metodo_pago);
    console.log('📝 Usuario ID:', req.userId);
    
    if (!metodo_pago) {
      return res.status(400).json({ 
        success: false,
        error: 'El método de pago es requerido' 
      });
    }

    const [pedidos] = await db.query('SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (pedidos.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Pedido no encontrado' 
      });
    }

    const pedido = pedidos[0];

    if (pedido.pagado === 1 || pedido.pagado === true) {
      return res.status(400).json({ 
        success: false,
        error: 'El pedido ya está pagado' 
      });
    }

    if (pedido.estado === 'cancelado') {
      return res.status(400).json({ 
        success: false,
        error: 'El pedido está cancelado' 
      });
    }

    const tipoEntrega = pedido.tipo_entrega || 'local';

    // Actualizar el pedido
    await db.query(
      `UPDATE pedidos 
       SET estado = 'entregado', 
           pagado = 1, 
           metodo_pago = ?,
           fecha_pago = NOW(),
           updated_at = NOW() 
       WHERE id = ?`,
      [metodo_pago, id]
    );

    // Obtener el pedido actualizado
    const [pedidoActualizado] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);
    const pedidoData = pedidoActualizado[0];

    // Parsear items
    let items = pedidoData.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    // Crear la venta
    const [ventaExistente] = await db.query('SELECT id FROM ventas WHERE pedido_id = ?', [id]);
    
    if (ventaExistente.length === 0) {
      await db.query(
        `INSERT INTO ventas 
         (pedido_id, usuario_id, mesa_id, cliente_id, cliente_nombre, 
          items, subtotal, igv, descuento, total, 
          metodo_pago, numero_operacion, tipo_entrega, estado, observaciones) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedidoData.id,
          pedidoData.usuario_id,
          pedidoData.mesa_id || null,
          pedidoData.cliente_id || null,
          pedidoData.cliente_nombre || null,
          JSON.stringify(items),
          parseFloat(pedidoData.subtotal) || 0,
          parseFloat(pedidoData.igv) || 0,
          0,
          parseFloat(pedidoData.total) || 0,
          metodo_pago,
          null,
          tipoEntrega,
          'completada',
          pedidoData.observaciones || null
        ]
      );
    }

    res.json({
      success: true,
      message: 'Pedido marcado como pagado correctamente',
      pedido: pedidoData
    });

  } catch (error) {
    console.error('❌ Error en marcarPagado:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al marcar pedido como pagado'
    });
  }
};

// ============================================
// ✅ OBTENER PEDIDOS PENDIENTES
// ============================================
exports.getPendientes = async (req, res) => {
  try {
    console.log('📝 === OBTENIENDO PEDIDOS PENDIENTES ===');
    
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
    
    rows.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });
    
    console.log(`✅ ${rows.length} pedidos pendientes encontrados`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error en getPendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};

// ============================================
// ✅ OBTENER PEDIDOS PAGADOS
// ============================================
exports.getPagados = async (req, res) => {
  try {
    console.log('📝 === OBTENIENDO PEDIDOS PAGADOS ===');
    
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
      ORDER BY p.fecha_pago DESC, p.created_at DESC
    `);
    
    rows.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });
    
    console.log(`✅ ${rows.length} pedidos pagados encontrados`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error en getPagados:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pagados' });
  }
};

// ============================================
// ✅ OBTENER PEDIDOS POR TIPO DE ENTREGA
// ============================================
exports.getByTipoEntrega = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    console.log(`📝 === OBTENIENDO PEDIDOS TIPO: ${tipo} ===`);
    
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
      ORDER BY p.created_at DESC
    `, [tipo]);
    
    rows.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });
    
    console.log(`✅ ${rows.length} pedidos tipo ${tipo} encontrados`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error en getByTipoEntrega:', error);
    res.status(500).json({ error: 'Error al obtener pedidos por tipo' });
  }
};

// ============================================
// ✅ OBTENER PEDIDOS ENTREGADOS DEL MESERO
// ============================================
exports.getPedidosPagadosMesero = async (req, res) => {
  try {
    const usuarioId = req.userId;
    
    console.log('📝 === PEDIDOS ENTREGADOS DEL MESERO ===');
    console.log('📝 Mesero ID:', usuarioId);
    
    if (!usuarioId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuario no autenticado' 
      });
    }
    
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
    
    rows.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });
    
    console.log(`✅ ${rows.length} pedidos entregados encontrados para el mesero`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error en getPedidosPagadosMesero:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener pedidos entregados del mesero'
    });
  }
};

// ============================================
// ACTUALIZAR ESTADO DEL PEDIDO
// ============================================
exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const actualizado = await Pedido.updateEstado(id, estado);
    if (actualizado) {
      const pedido = await Pedido.findById(id);
      if (pedido && typeof pedido.items === 'string') {
        pedido.items = JSON.parse(pedido.items);
      }
      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        pedido
      });
    } else {
      res.status(404).json({ error: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// ============================================
// ELIMINAR PEDIDO
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Pedido.delete(id);
    if (eliminado) {
      res.json({ success: true, message: 'Pedido eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
};