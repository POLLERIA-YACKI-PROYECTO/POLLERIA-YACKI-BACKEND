// src/controllers/dashboard.controller.js
const db = require('../config/database');

exports.getResumenUnificado = async (req, res) => {
  try {
    // ============================================
    // 1. VENTAS REALES (incluye las de origen 'pedido_web')
    //    Ya NO forzamos pedido_cliente_id = NULL
    // ============================================
    const [ventas] = await db.query(`
      SELECT 
        'venta' AS origen,
        v.id,
        v.id AS venta_id,
        v.pedido_cliente_id,                       -- ✅ REAL, no NULL
        v.cliente_nombre,
        v.total,
        v.tipo_entrega,
        v.metodo_pago,
        v.estado,
        v.fecha_venta AS fecha,
        v.created_at,
        u.nombre AS usuario_nombre,
        u.rol AS usuario_rol
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.deleted_at IS NULL
        AND v.estado = 'completada'
      ORDER BY v.fecha_venta DESC
    `);

    // ============================================
    // 2. PEDIDOS WEB CONFIRMADOS SIN VENTA VINCULADA
    //    ✅ Con NOT EXISTS para no duplicar
    // ============================================
    const [pedidosWeb] = await db.query(`
      SELECT 
        'pedido_web' AS origen,
        pc.id,
        pc.id AS pedido_cliente_id,
        NULL AS venta_id,
        pc.cliente_nombre,
        pc.total,
        pc.tipo_entrega,
        pc.metodo_pago,
        'completada' AS estado,
        pc.fecha_confirmacion AS fecha,
        pc.created_at,
        'Cliente Web' AS usuario_nombre,
        'cliente' AS usuario_rol
      FROM pedidos_cliente pc
      WHERE pc.deleted_at IS NULL
        AND pc.pagado = TRUE
        AND pc.fecha_confirmacion IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM ventas v2
          WHERE v2.pedido_cliente_id = pc.id
            AND v2.deleted_at IS NULL
        )
      ORDER BY pc.fecha_confirmacion DESC
    `);

    // ============================================
    // 3. UNIFICAR (sin duplicados reales)
    // ============================================
    const todas = [
      ...ventas.map(v => ({ ...v, total: parseFloat(v.total) || 0 })),
      ...pedidosWeb.map(p => ({ ...p, total: parseFloat(p.total) || 0 }))
    ];

    // Deduplicación de seguridad por pedido_cliente_id
    // (por si alguna venta antigua tiene pedido_cliente_id = NULL pero es web)
    const mapa = new Map();
    todas.forEach(v => {
      const pedidoClienteId = 
        v.pedido_cliente_id !== null && 
        v.pedido_cliente_id !== undefined && 
        v.pedido_cliente_id !== ''
          ? Number(v.pedido_cliente_id)
          : null;

      const clave = pedidoClienteId !== null
        ? `PC-${pedidoClienteId}`
        : `V-${v.id}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, v);
      } else {
        // Si ya existe, preferir la VENTA (origen='venta') sobre el pedido web
        const existente = mapa.get(clave);
        if (existente.origen === 'pedido_web' && v.origen === 'venta') {
          mapa.set(clave, v);
        }
      }
    });

    const unificadas = Array.from(mapa.values());

    // ============================================
    // 4. CALCULAR TOTALES
    // ============================================
    const totalRecaudado = unificadas.reduce((sum, v) => sum + v.total, 0);
    const totalVentas = unificadas.length;

    const local = unificadas.filter(v =>
      v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar'
    );
    const delivery = unificadas.filter(v =>
      v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada'
    );

    const recaudadoLocal = local.reduce((sum, v) => sum + v.total, 0);
    const recaudadoDelivery = delivery.reduce((sum, v) => sum + v.total, 0);

    // Ventas de hoy
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const ventasHoy = unificadas.filter(v => {
      const fecha = String(v.fecha || v.created_at).substring(0, 10);
      return fecha === hoyStr;
    });

    const recaudadoHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    // ============================================
    // 5. VENTAS RECIENTES (10 últimas)
    // ============================================
    const recientes = [...unificadas]
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || a.created_at).getTime();
        const fechaB = new Date(b.fecha || b.created_at).getTime();
        return fechaB - fechaA;
      })
      .slice(0, 10)
      .map(v => {
        const pedidoClienteId =
          v.pedido_cliente_id !== null &&
          v.pedido_cliente_id !== undefined &&
          v.pedido_cliente_id !== ''
            ? Number(v.pedido_cliente_id)
            : null;

        return {
          ...v,
          // id_unico coherente: PC-{pedido_cliente_id} si es web, V-{id} si es mesero
          id_unico: pedidoClienteId !== null
            ? `PC-${pedidoClienteId}`
            : `V-${v.id}`,
          atendio: v.origen === 'venta'
            ? (v.usuario_nombre || 'Mesero')
            : 'Cliente Web'
        };
      });

    res.json({
      success: true,
      resumen: {
        totalVentas,
        ventasLocal: local.length,
        ventasDelivery: delivery.length,
        totalRecaudado,
        recaudadoLocal,
        recaudadoDelivery,
        ventasHoy: ventasHoy.length,
        recaudadoHoy
      },
      ventasRecientes: recientes
    });

  } catch (error) {
    console.error('Error en getResumenUnificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen',
      detalle: error.message
    });
  }
};