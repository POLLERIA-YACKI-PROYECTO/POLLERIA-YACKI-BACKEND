// src/controllers/pedido.controller.js - COMPLETO CON HISTORIAL
const Pedido = require('../models/Pedido');
const db = require('../config/database');
const HistorialActividad = require('../models/HistorialActividad');

// Helper para registrar actividad sin romper el flujo
const logActividad = async (data) => {
  try {
    await HistorialActividad.registrar(data);
  } catch (err) {
    console.error('Error al registrar historial:', err);
  }
};

// Helper para IP y user-agent
const getMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
  user_agent: req.headers['user-agent'] || null
});

// ============================================
// OBTENER TODOS LOS PEDIDOS
// ============================================
exports.getAll = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const userRol = req.userRol;

    console.log('=== OBTENIENDO PEDIDOS ===');
    console.log('Usuario ID:', usuarioId);
    console.log('Rol:', userRol);

    let pedidos;

    if (userRol === 'admin' || userRol === 'cajero') {
      pedidos = await Pedido.findAll();
    } else {
      pedidos = await Pedido.findByUsuario(usuarioId);
    }

    pedidos = pedidos.map(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }

      if (p.usuario_nombre) {
        p.usuario_nombre_completo = p.usuario_apellido
          ? `${p.usuario_nombre} ${p.usuario_apellido}`
          : p.usuario_nombre;
      } else {
        p.usuario_nombre_completo = 'Usuario desconocido';
      }

      return p;
    });

    console.log(`${pedidos.length} pedidos encontrados`);
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

    if (typeof pedido.items === 'string') {
      try {
        pedido.items = JSON.parse(pedido.items);
      } catch (e) {
        pedido.items = [];
      }
    }

    if (pedido.usuario_nombre) {
      pedido.usuario_nombre_completo = pedido.usuario_apellido
        ? `${pedido.usuario_nombre} ${pedido.usuario_apellido}`
        : pedido.usuario_nombre;
    }

    res.json(pedido);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// ============================================
// CREAR PEDIDO
// ============================================
exports.create = async (req, res) => {
  try {
    console.log('=== CREANDO PEDIDO ===');
    console.log('Body:', req.body);
    console.log('Usuario ID:', req.userId);

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
      console.log('Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!items || items.length === 0) {
      console.log('El pedido debe tener al menos un item');
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    let itemsProcesados = [];

    try {
      if (Array.isArray(items)) {
        itemsProcesados = items.map(item => ({
          id: Number(item.id) || 0,
          nombre: String(item.nombre || '').trim(),
          precio: Number(item.precio) || 0,
          cantidad: Number(item.cantidad) || 0,
          subtotal: Number(item.subtotal) || (Number(item.precio) * Number(item.cantidad))
        }));
      } else if (typeof items === 'string') {
        try {
          const parsed = JSON.parse(items);
          if (Array.isArray(parsed)) {
            itemsProcesados = parsed.map(item => ({
              id: Number(item.id) || 0,
              nombre: String(item.nombre || '').trim(),
              precio: Number(item.precio) || 0,
              cantidad: Number(item.cantidad) || 0,
              subtotal: Number(item.subtotal) || (Number(item.precio) * Number(item.cantidad))
            }));
          }
        } catch (e) {
          console.error('Error al parsear items string:', e);
          itemsProcesados = [];
        }
      }
    } catch (error) {
      console.error('Error al procesar items:', error);
      itemsProcesados = [];
    }

    if (itemsProcesados.length === 0) {
      console.log('No se pudieron procesar los items correctamente');
      return res.status(400).json({
        success: false,
        error: 'Los items del pedido no son válidos'
      });
    }

    let subtotal = 0;
    itemsProcesados.forEach(item => {
      subtotal += Number(item.precio) * Number(item.cantidad);
    });

    const igv = subtotal * 0.18;
    const totalFinal = total || (subtotal + igv);

    console.log('Items procesados:', JSON.stringify(itemsProcesados));
    console.log('Subtotal:', subtotal);
    console.log('IGV:', igv);
    console.log('Total:', totalFinal);

    const nuevoPedido = await Pedido.create({
      usuario_id,
      mesa_id: mesa_id || null,
      items: itemsProcesados,
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

    console.log('Pedido creado con ID:', nuevoPedido.id);

    // ============================================
    // HISTORIAL: Registrar creación de pedido
    // ============================================
    if (cliente_id) {
      await logActividad({
        cliente_id: cliente_id,
        tipo_usuario: 'cliente',
        accion: 'pedido_creado',
        descripcion: `Pedido #${nuevoPedido.id} creado por S/ ${totalFinal}`,
        datos: {
          pedido_id: nuevoPedido.id,
          total: totalFinal,
          tipo_entrega: tipo_entrega || 'local',
          metodo_pago: metodo_pago || null,
          items_count: itemsProcesados.length
        },
        ...getMeta(req)
      });
    } else {
      await logActividad({
        usuario_id: usuario_id,
        tipo_usuario: 'usuario',
        accion: 'pedido_creado',
        descripcion: `Pedido #${nuevoPedido.id} creado por S/ ${totalFinal} (mesero/cajero)`,
        datos: {
          pedido_id: nuevoPedido.id,
          total: totalFinal,
          tipo_entrega: tipo_entrega || 'local',
          cliente_nombre: cliente_nombre || 'Cliente'
        },
        ...getMeta(req)
      });
    }

    const pedidoCompleto = await Pedido.findById(nuevoPedido.id);
    if (pedidoCompleto && typeof pedidoCompleto.items === 'string') {
      try {
        pedidoCompleto.items = JSON.parse(pedidoCompleto.items);
      } catch (e) {
        pedidoCompleto.items = [];
      }
    }

    if (pagado === true || pagado === 1) {
      console.log('Pedido marcado como pagado directamente');

      await Pedido.updateEstado(nuevoPedido.id, 'entregado');

      const ventaData = {
        pedido_id: nuevoPedido.id,
        usuario_id: usuario_id,
        cliente_nombre: cliente_nombre || 'Cliente',
        cliente_id: cliente_id || null,
        items: itemsProcesados,
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

      // Historial: pedido completado
      await logActividad({
        cliente_id: cliente_id || null,
        usuario_id: !cliente_id ? usuario_id : null,
        tipo_usuario: cliente_id ? 'cliente' : 'usuario',
        accion: 'pedido_completado',
        descripcion: `Pedido #${nuevoPedido.id} completado y pagado`,
        datos: { pedido_id: nuevoPedido.id, total: totalFinal },
        ...getMeta(req)
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      pedido: pedidoCompleto || nuevoPedido
    });

  } catch (error) {
    console.error('Error en create:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al crear pedido',
      detalle: error.message
    });
  }
};

// ============================================
// MARCAR PEDIDO COMO PAGADO
// ============================================
exports.marcarPagado = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_pago } = req.body;

    console.log('=== MARCANDO PAGO ===');
    console.log('Pedido ID:', id);
    console.log('Método de pago:', metodo_pago);
    console.log('Usuario ID:', req.userId);

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

    await db.query(
      `UPDATE pedidos
       SET estado = 'entregado',
           pagado = 1,
           metodo_pago = ?,
           fecha_pago = NOW(),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [metodo_pago, id]
    );

    const [pedidoActualizado] = await db.query('SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL', [id]);
    const pedidoData = pedidoActualizado[0];

    let items = pedidoData.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    const [ventaExistente] = await db.query('SELECT id FROM ventas WHERE pedido_id = ? AND deleted_at IS NULL', [id]);

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

    // Historial: pedido completado / pagado
    await logActividad({
      cliente_id: pedidoData.cliente_id || null,
      usuario_id: !pedidoData.cliente_id ? pedidoData.usuario_id : null,
      tipo_usuario: pedidoData.cliente_id ? 'cliente' : 'usuario',
      accion: 'pedido_completado',
      descripcion: `Pedido #${pedidoData.id} marcado como pagado (${metodo_pago}) - S/ ${pedidoData.total}`,
      datos: {
        pedido_id: pedidoData.id,
        total: parseFloat(pedidoData.total),
        metodo_pago
      },
      ...getMeta(req)
    });

    res.json({
      success: true,
      message: 'Pedido marcado como pagado correctamente',
      pedido: pedidoData
    });

  } catch (error) {
    console.error('Error en marcarPagado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar pedido como pagado'
    });
  }
};

// ============================================
// OBTENER PEDIDOS PENDIENTES
// ============================================
exports.getPendientes = async (req, res) => {
  try {
    console.log('=== OBTENIENDO PEDIDOS PENDIENTES ===');

    const pedidos = await Pedido.findPendientes();

    pedidos.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });

    console.log(`${pedidos.length} pedidos pendientes encontrados`);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};

// ============================================
// OBTENER PEDIDOS PAGADOS
// ============================================
exports.getPagados = async (req, res) => {
  try {
    console.log('=== OBTENIENDO PEDIDOS PAGADOS ===');

    const pedidos = await Pedido.findPagados();

    pedidos.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });

    console.log(`${pedidos.length} pedidos pagados encontrados`);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPagados:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pagados' });
  }
};

// ============================================
// OBTENER PEDIDOS POR TIPO DE ENTREGA
// ============================================
exports.getByTipoEntrega = async (req, res) => {
  try {
    const { tipo } = req.params;

    console.log(`=== OBTENIENDO PEDIDOS TIPO: ${tipo} ===`);

    const pedidos = await Pedido.findByTipoEntrega(tipo);

    pedidos.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });

    console.log(`${pedidos.length} pedidos tipo ${tipo} encontrados`);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getByTipoEntrega:', error);
    res.status(500).json({ error: 'Error al obtener pedidos por tipo' });
  }
};

// ============================================
// OBTENER PEDIDOS ENTREGADOS DEL MESERO
// ============================================
exports.getPedidosPagadosMesero = async (req, res) => {
  try {
    const usuarioId = req.userId;

    console.log('=== PEDIDOS ENTREGADOS DEL MESERO ===');
    console.log('Mesero ID:', usuarioId);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const pedidos = await Pedido.findEntregadosByUsuario(usuarioId);

    pedidos.forEach(p => {
      if (typeof p.items === 'string') {
        try {
          p.items = JSON.parse(p.items);
        } catch (e) {
          p.items = [];
        }
      }
    });

    console.log(`${pedidos.length} pedidos entregados encontrados para el mesero`);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPedidosPagadosMesero:', error);
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
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Los estados válidos son: ' + estadosValidos.join(', ')
      });
    }

    const actualizado = await Pedido.updateEstado(id, estado);
    if (actualizado) {
      const pedido = await Pedido.findById(id);
      if (pedido && typeof pedido.items === 'string') {
        try {
          pedido.items = JSON.parse(pedido.items);
        } catch (e) {
          pedido.items = [];
        }
      }

      // Historial: si se cancela, registrar
      if (estado === 'cancelado' && pedido) {
        await logActividad({
          cliente_id: pedido.cliente_id || null,
          usuario_id: !pedido.cliente_id ? pedido.usuario_id : null,
          tipo_usuario: pedido.cliente_id ? 'cliente' : 'usuario',
          accion: 'pedido_cancelado',
          descripcion: `Pedido #${pedido.id} cancelado - S/ ${pedido.total}`,
          datos: { pedido_id: pedido.id, total: parseFloat(pedido.total) },
          ...getMeta(req)
        });
      }

      // Historial: si se completa/entrega, registrar
      if (estado === 'entregado' && pedido) {
        await logActividad({
          cliente_id: pedido.cliente_id || null,
          usuario_id: !pedido.cliente_id ? pedido.usuario_id : null,
          tipo_usuario: pedido.cliente_id ? 'cliente' : 'usuario',
          accion: 'pedido_completado',
          descripcion: `Pedido #${pedido.id} entregado - S/ ${pedido.total}`,
          datos: { pedido_id: pedido.id, total: parseFloat(pedido.total) },
          ...getMeta(req)
        });
      }

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        pedido
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
  } catch (error) {
    console.error('Error en updateEstado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado'
    });
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
      res.json({
        success: true,
        message: 'Pedido eliminado correctamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar pedido'
    });
  }
};