// routes/pago.routes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

function generarIdBoletaUnico() {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const aleatorio = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BOL-${fecha}-${aleatorio}`;
}

// Genera el QR dinámico con el monto exacto
router.get('/pedido/:id/qr', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [pedidos] = await db.query('SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL', [id]);

    if (pedidos.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    const pedido = pedidos[0];
    const montoExacto = parseFloat(pedido.total).toFixed(2);
    const telefonoYape = process.env.YAPE_PHONE_NUMBER || '987654321';

    const qrPayload = `00020101021226480009pe.yape0112${telefonoYape}520459995303604540${montoExacto}5802PE5914PolleriaYacky6004Lima6304`;

    res.json({
      success: true,
      data: {
        pedidoId: pedido.id,
        monto: montoExacto,
        moneda: 'PEN',
        comercio: 'Pollería Yacky',
        qrPayload
      }
    });
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ success: false, error: 'Error al generar código QR' });
  }
});

// Webhook para la confirmación del pago
router.post('/webhook', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { evento, referencia_pedido_id, transaccion_id, monto, metodo_pago = 'qr' } = req.body;

    if (evento !== 'pago.exitoso') {
      return res.status(200).json({ recibido: true, ignorado: true });
    }

    await connection.beginTransaction();

    const [pedidos] = await connection.query(
      'SELECT * FROM pedidos WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [referencia_pedido_id]
    );

    if (pedidos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: `Pedido ${referencia_pedido_id} no encontrado` });
    }

    const pedido = pedidos[0];

    if (pedido.pagado === 1 || pedido.estado === 'entregado') {
      await connection.rollback();
      return res.status(200).json({ recibido: true, yaProcesado: true });
    }

    const totalPedido = parseFloat(pedido.total);
    const totalPagado = parseFloat(monto);
    if (Math.abs(totalPedido - totalPagado) > 0.01) {
      await connection.rollback();
      return res.status(400).json({ error: 'El monto pagado no coincide con el total del pedido' });
    }

    const codigoBoleta = generarIdBoletaUnico();

    await connection.query(
      `INSERT INTO pagos (pedido_id, metodo_pago, monto, transaccion_pasarela_id, codigo_boleta, estado, pagado_en)
       VALUES (?, ?, ?, ?, ?, 'confirmado', NOW())`,
      [pedido.id, metodo_pago, totalPagado, transaccion_id, codigoBoleta]
    );

    await connection.query(
      `UPDATE pedidos SET estado = 'entregado', pagado = 1, metodo_pago = ?, updated_at = NOW() WHERE id = ?`,
      [metodo_pago, pedido.id]
    );

    let items = pedido.items;
    if (typeof items !== 'string') items = JSON.stringify(items);

    await connection.query(
      `INSERT INTO ventas (pedido_id, usuario_id, cliente_nombre, items, subtotal, igv, total, metodo_pago, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completada', ?)`,
      [
        pedido.id,
        pedido.usuario_id,
        pedido.cliente_nombre || 'Cliente',
        items,
        pedido.subtotal,
        pedido.igv,
        pedido.total,
        metodo_pago,
        pedido.observaciones || null
      ]
    );

    await connection.commit();

    res.status(200).json({
      recibido: true,
      pedidoId: pedido.id,
      codigoBoleta,
      estado: 'entregado'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en webhook de pago:', error.message);
    res.status(400).json({ recibido: false, error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;