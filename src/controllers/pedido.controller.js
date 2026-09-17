// src/controllers/pedido.controller.js - COMPLETO Y CORREGIDO
const Pedido = require('../models/Pedido');
const db = require('../config/database');
const HistorialActividad = require('../models/HistorialActividad');

// ============================================
// HELPERS
// ============================================

const logActividad = async (data) => {
  try {
    await HistorialActividad.registrar(data);
  } catch (err) {
    console.error('Error al registrar historial:', err);
  }
};

const getMeta = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
  user_agent: req.headers['user-agent'] || null
});

/**
 * Resuelve el cliente_id automáticamente
 */
const resolverClienteId = async (cliente_id, cliente_nombre) => {
  if (cliente_id && !isNaN(Number(cliente_id))) {
    return Number(cliente_id);
  }

  if (cliente_nombre && String(cliente_nombre).trim()) {
    try {
      const [rows] = await db.query(
        `SELECT id FROM clientes 
         WHERE nombre = ? 
           AND deleted_at IS NULL 
         LIMIT 1`,
        [String(cliente_nombre).trim()]
      );
      if (rows[0]) {
        console.log(` Cliente resuelto por nombre "${cliente_nombre}" → id ${rows[0].id}`);
        return rows[0].id;
      }
    } catch (err) {
      console.error('Error al resolver cliente por nombre:', err);
    }
  }

  console.log(` No se pudo resolver cliente_id para "${cliente_nombre}"`);
  return null;
};

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
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    const clienteIdResuelto = await resolverClienteId(cliente_id, cliente_nombre);

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

    const nuevoPedido = await Pedido.create({
      usuario_id,
      mesa_id: mesa_id || null,
      items: itemsProcesados,
      subtotal,
      igv,
      total: totalFinal,
      cliente_nombre: cliente_nombre || 'Cliente',
      cliente_id: clienteIdResuelto,
      tipo: tipo || 'local',
      tipo_entrega: tipo_entrega || 'local',
      estado: 'pendiente',
      observaciones: observaciones || null,
      metodo_pago: metodo_pago || null,
      pagado: pagado || 0
    });

    // Historial
    if (clienteIdResuelto) {
      await logActividad({
        cliente_id: clienteIdResuelto,
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

    // Si ya viene pagado → crear venta
    if (pagado === true || pagado === 1) {
      await Pedido.updateEstado(nuevoPedido.id, 'entregado');

      const ventaData = {
        pedido_id: nuevoPedido.id,
        usuario_id: usuario_id,
        mesa_id: mesa_id || null,
        cliente_id: clienteIdResuelto,
        cliente_nombre: cliente_nombre || 'Cliente',
        items: itemsProcesados,
        subtotal: subtotal,
        igv: igv,
        descuento: 0,
        total: totalFinal,
        metodo_pago: metodo_pago || 'efectivo',
        numero_operacion: null,
        tipo_entrega: tipo_entrega || 'local',
        estado: 'completada',
        observaciones: observaciones || null
      };

      await Pedido.crearVenta(ventaData);
      await Pedido.marcarPagado(nuevoPedido.id, metodo_pago || 'efectivo');

      await logActividad({
        cliente_id: clienteIdResuelto || null,
        usuario_id: !clienteIdResuelto ? usuario_id : null,
        tipo_usuario: clienteIdResuelto ? 'cliente' : 'usuario',
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

    if (!metodo_pago) {
      return res.status(400).json({
        success: false,
        error: 'El método de pago es requerido'
      });
    }

    const [pedidos] = await db.query(
      'SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

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
    const clienteIdResuelto = await resolverClienteId(
      pedido.cliente_id,
      pedido.cliente_nombre
    );

    await db.query(
      `UPDATE pedidos
       SET estado = 'entregado',
           pagado = 1,
           cliente_id = COALESCE(cliente_id, ?),
           metodo_pago = ?,
           fecha_pago = NOW(),
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [clienteIdResuelto, metodo_pago, id]
    );

    const [pedidoActualizado] = await db.query(
      'SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    const pedidoData = pedidoActualizado[0];

    let items = pedidoData.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    const [ventaExistente] = await db.query(
      'SELECT id FROM ventas WHERE pedido_id = ? AND deleted_at IS NULL',
      [id]
    );

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
          clienteIdResuelto,
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

    await logActividad({
      cliente_id: clienteIdResuelto || null,
      usuario_id: !clienteIdResuelto ? pedidoData.usuario_id : null,
      tipo_usuario: clienteIdResuelto ? 'cliente' : 'usuario',
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
      pedido: {
        ...pedidoData,
        cliente_id: clienteIdResuelto
      }
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