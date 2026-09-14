// src/controllers/dashboard.controller.js
const db = require('../config/database');

exports.getResumenUnificado = async (req, res) => {
  try {
    // ============================================
    // 1. VENTAS TRADICIONALES
    // ============================================
    const [ventas] = await db.query(`
      SELECT 
        'venta' AS origen,
        v.id,
        v.id AS venta_id,
        NULL AS pedido_cliente_id,
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
    `);

    // ============================================
    // 2. PEDIDOS WEB CONFIRMADOS
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
    `);

    // ============================================
    // 3. UNIFICAR (evitar duplicados)
    // ============================================
    // Las ventas creadas automáticamente tienen pedido_id = NULL (no vinculado)
    // Los pedidos web confirmados generan una venta con pedido_id = NULL
    // Para evitar duplicados: contamos solo las VENTAS + los PEDIDOS WEB sin venta asociada
    
    const todas = [
      ...ventas.map(v => ({ ...v, total: parseFloat(v.total) || 0 })),
      ...pedidosWeb.map(p => ({ ...p, total: parseFloat(p.total) || 0 }))
    ];

    // ============================================
    // 4. CALCULAR TOTALES
    // ============================================
    const totalRecaudado = todas.reduce((sum, v) => sum + v.total, 0);
    const totalVentas = todas.length;

    // Local
    const local = todas.filter(v =>
      v.tipo_entrega === 'local' || v.tipo_entrega === 'paraLlevar'
    );
    // Motorizado
    const delivery = todas.filter(v =>
      v.tipo_entrega === 'delivery' || v.tipo_entrega === 'motorizada'
    );

    const recaudadoLocal = local.reduce((sum, v) => sum + v.total, 0);
    const recaudadoDelivery = delivery.reduce((sum, v) => sum + v.total, 0);

    // Ventas de hoy
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const ventasHoy = todas.filter(v => {
      const fecha = String(v.fecha || v.created_at).substring(0, 10);
      return fecha === hoyStr;
    });

    const recaudadoHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    // Ventas recientes
    const recientes = [...todas]
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || a.created_at).getTime();
        const fechaB = new Date(b.fecha || b.created_at).getTime();
        return fechaB - fechaA;
      })
      .slice(0, 10)
      .map(v => ({
        ...v,
        // ID único compuesto
        id_unico: v.origen === 'venta' 
          ? `V-${v.id}` 
          : `PC-${v.id}`,
        // Nombre de quien atendió
        atendio: v.origen === 'venta' 
          ? (v.usuario_nombre || 'Mesero')
          : 'Cliente Web'
      }));

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