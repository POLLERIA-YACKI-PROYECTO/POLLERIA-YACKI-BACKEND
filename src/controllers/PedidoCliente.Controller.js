// src/controllers/pedidoCliente.controller.js
const PedidoCliente = require('../models/PedidoCliente');
const db = require('../config/database');
const HistorialActividad = require('../models/HistorialActividad');

// ============================================
// GET ALL
// ============================================
exports.getAll = async (req, res) => {
  try {
    const pedidos = await PedidoCliente.findAll();
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getAll pedidos cliente:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// ============================================
// GET BY ID
// ============================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoCliente.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error en getById pedido cliente:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// ============================================
// GET BY CLIENTE
// ============================================
exports.getByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const pedidos = await PedidoCliente.findByClienteId(clienteId);
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getByCliente:', error);
    res.status(500).json({ error: 'Error al obtener pedidos del cliente' });
  }
};

// ============================================
// GET PENDIENTES
// ============================================
exports.getPendientes = async (req, res) => {
  try {
    const pedidos = await PedidoCliente.findPendientes();
    res.json(pedidos);
  } catch (error) {
    console.error('Error en getPendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
};

// ============================================
// CREATE
// ============================================
exports.create = async (req, res) => {
  try {
    console.log('=== CREANDO PEDIDO CLIENTE ===');
    console.log('Body:', req.body);

    const pedido = req.body;

    if (!pedido.items || !Array.isArray(pedido.items) || pedido.items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }
    if (!pedido.total || pedido.total <= 0) {
      return res.status(400).json({ error: 'El total del pedido es inválido' });
    }
    if (!pedido.metodo_pago) {
      return res.status(400).json({ error: 'Debes seleccionar un método de pago' });
    }
    if (!pedido.cliente_nombre) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }

    if (req.userId && req.userRol === 'cliente') {
      pedido.cliente_id = req.userId;
    }

    const nuevoPedido = await PedidoCliente.create(pedido);
    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      pedido: nuevoPedido
    });
  } catch (error) {
    console.error('Error al crear pedido cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el pedido',
      detalle: error.message
    });
  }
};

// ============================================
// ✅ SUBIR COMPROBANTE
// ============================================
exports.subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const rutaComprobante = `/uploads/comprobantes/${req.file.filename}`;

    const actualizado = await PedidoCliente.guardarComprobante(id, rutaComprobante);
    if (!actualizado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      success: true,
      message: 'Comprobante subido correctamente',
      comprobante: rutaComprobante
    });
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    res.status(500).json({ error: 'Error al subir comprobante' });
  }
};

// ============================================
// ✅ CONFIRMAR PAGO (SOLO ADMIN)
// - Marca como pagado
// - Crea VENTA automáticamente con origen = 'pedido_web'
// - Vincula venta al pedido
// ============================================
exports.confirmarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_entrega } = req.body;
    const adminId = req.userId;

    console.log('=== CONFIRMANDO PAGO ===');
    console.log('Pedido ID:', id);
    console.log('Admin ID:', adminId);
    console.log('Tipo entrega:', tipo_entrega);

    if (!adminId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const pedido = await PedidoCliente.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (pedido.pagado) {
      return res.status(400).json({ error: 'Este pedido ya fue confirmado' });
    }

    // 1. Actualizar tipo de entrega si se especifica
    let tipoEntregaFinal = pedido.tipo_entrega || 'local';
    if (tipo_entrega && ['local', 'delivery', 'paraLlevar', 'motorizada'].includes(tipo_entrega)) {
      await PedidoCliente.actualizarTipoEntrega(id, tipo_entrega);
      tipoEntregaFinal = tipo_entrega;
    }

    // 2. Confirmar pago
    const actualizado = await PedidoCliente.confirmarPago(id, adminId);
    if (!actualizado) {
      return res.status(500).json({ error: 'No se pudo confirmar el pago' });
    }

    // 3. ✅ CREAR VENTA AUTOMÁTICAMENTE
    let ventaId = null;
    try {
      const items = typeof pedido.items === 'string'
        ? JSON.parse(pedido.items)
        : pedido.items;

      // ✅ Verificar si ya existe una venta para este pedido
      const [ventaExistente] = await db.query(
        'SELECT id FROM ventas WHERE pedido_cliente_id = ? AND deleted_at IS NULL',
        [id]
      );

      if (ventaExistente.length > 0) {
        ventaId = ventaExistente[0].id;
        console.log('⚠️ Ya existía una venta para este pedido:', ventaId);
      } else {
        // ✅ Crear nueva venta con origen = 'pedido_web'
        const [ventaResult] = await db.query(
          `INSERT INTO ventas
            (pedido_id, pedido_cliente_id, usuario_id, mesa_id, cliente_id, cliente_nombre,
             items, subtotal, igv, descuento, total,
             metodo_pago, numero_operacion, tipo_entrega, origen, estado, observaciones)
           VALUES (NULL, ?, ?, NULL, ?, ?, CAST(? AS JSON), ?, ?, 0, ?, ?, ?, ?, 'pedido_web', 'completada', ?)`,
          [
            id,
            adminId,
            pedido.cliente_id || null,
            pedido.cliente_nombre || 'Cliente Web',
            JSON.stringify(items),
            parseFloat(pedido.subtotal) || 0,
            parseFloat(pedido.igv) || 0,
            parseFloat(pedido.total) || 0,
            pedido.metodo_pago || 'efectivo',
            pedido.numero_operacion || null,
            tipoEntregaFinal,
            pedido.observaciones || null
          ]
        );

        ventaId = ventaResult.insertId;
        console.log('✅ Venta creada automáticamente con ID:', ventaId);

        await PedidoCliente.vincularVenta(id, ventaId);
      }
    } catch (ventaError) {
      console.error('⚠️ Error al crear venta:', ventaError);
    }

    // 4. Registrar en historial
    try {
      await HistorialActividad.registrar({
        usuario_id: adminId,
        tipo_usuario: 'usuario',
        accion: 'pedido_completado',
        descripcion: `Pago confirmado del pedido #${id} - S/ ${pedido.total} (${tipoEntregaFinal})`,
        datos: {
          pedido_id: id,
          venta_id: ventaId,
          total: pedido.total,
          metodo: pedido.metodo_pago,
          tipo_entrega: tipoEntregaFinal
        }
      });
    } catch (e) {
      console.error('Error al registrar historial:', e);
    }

    const pedidoActualizado = await PedidoCliente.findById(id);

    res.json({
      success: true,
      message: 'Pago confirmado y venta registrada correctamente',
      pedido: pedidoActualizado,
      venta_id: ventaId
    });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
};

// ============================================
// ✅ RECHAZAR PAGO (SOLO ADMIN)
// ============================================
exports.rechazarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const adminId = req.userId;

    const pedido = await PedidoCliente.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (pedido.pagado) {
      return res.status(400).json({ error: 'No se puede rechazar un pago ya confirmado' });
    }

    const actualizado = await PedidoCliente.rechazarPago(
      id,
      motivo || 'Pago no verificado',
      adminId
    );

    if (!actualizado) {
      return res.status(500).json({ error: 'No se pudo rechazar el pago' });
    }

    res.json({
      success: true,
      message: 'Pago rechazado correctamente'
    });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    res.status(500).json({ error: 'Error al rechazar pago' });
  }
};

// ============================================
// UPDATE ESTADO
// ============================================
exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const actualizado = await PedidoCliente.updateEstado(id, estado);
    if (!actualizado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// ============================================
// DELETE
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await PedidoCliente.delete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json({ success: true, message: 'Pedido eliminado' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
};