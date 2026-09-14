// src/controllers/pedidoCliente.controller.js
const PedidoCliente = require('../models/PedidoCliente');

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

    // Validaciones
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

    // Si el pedido viene de un cliente autenticado
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
// ✅ CONFIRMAR PAGO (solo admin)
// ============================================
exports.confirmarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    console.log('=== CONFIRMANDO PAGO ===');
    console.log('Pedido ID:', id);
    console.log('Admin ID:', adminId);

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

    const actualizado = await PedidoCliente.confirmarPago(id, adminId);
    if (!actualizado) {
      return res.status(500).json({ error: 'No se pudo confirmar el pago' });
    }

    const pedidoActualizado = await PedidoCliente.findById(id);

    // Registrar en historial
    try {
      const HistorialActividad = require('../models/HistorialActividad');
      await HistorialActividad.registrar({
        usuario_id: adminId,
        tipo_usuario: 'usuario',
        accion: 'pedido_completado',
        descripcion: `Pago confirmado del pedido #${id} - S/ ${pedido.total}`,
        datos: {
          pedido_id: id,
          total: pedido.total,
          metodo: pedido.metodo_pago
        }
      });
    } catch (e) {
      console.error('Error al registrar historial:', e);
    }

    res.json({
      success: true,
      message: 'Pago confirmado correctamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
};

// ============================================
// ✅ RECHAZAR PAGO (solo admin)
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
// MARCAR PAGADO (legacy)
// ============================================
exports.marcarPagado = async (req, res) => {
  try {
    const { id } = req.params;
    const { metodo_pago, numero_operacion } = req.body;

    const pedido = await PedidoCliente.findById(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (pedido.pagado) {
      return res.status(400).json({ error: 'Este pedido ya está pagado' });
    }

    const actualizado = await PedidoCliente.marcarPagado(
      id,
      metodo_pago || pedido.metodo_pago,
      numero_operacion
    );

    if (!actualizado) {
      return res.status(500).json({ error: 'No se pudo actualizar el pedido' });
    }

    const pedidoActualizado = await PedidoCliente.findById(id);
    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      pedido: pedidoActualizado
    });
  } catch (error) {
    console.error('Error al marcar pagado:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
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