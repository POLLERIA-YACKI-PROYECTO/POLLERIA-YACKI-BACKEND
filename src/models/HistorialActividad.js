// src/models/HistorialActividad.js
const db = require('../config/database');

const HistorialActividad = {
  // ============================================
  // REGISTRAR ACTIVIDAD
  // ============================================
  async registrar(data) {
    const {
      usuario_id = null,
      cliente_id = null,
      tipo_usuario = 'usuario',
      accion,
      descripcion = null,
      ip = null,
      user_agent = null,
      datos = null
    } = data;

    const [result] = await db.query(
      `INSERT INTO historial_actividad
        (usuario_id, cliente_id, tipo_usuario, accion, descripcion, ip, user_agent, datos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        cliente_id,
        tipo_usuario,
        accion,
        descripcion,
        ip,
        user_agent,
        datos ? JSON.stringify(datos) : null
      ]
    );
    return result.insertId;
  },

  // ============================================
  // LISTAR ACTIVIDAD
  // ============================================
  async findAll({ limit = 100, offset = 0, accion = null, tipo_usuario = null } = {}) {
    let where = [];
    let params = [];

    if (accion) {
      where.push('ha.accion = ?');
      params.push(accion);
    }
    if (tipo_usuario) {
      where.push('ha.tipo_usuario = ?');
      params.push(tipo_usuario);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT
         ha.*,
         u.nombre AS usuario_nombre,
         u.apellido AS usuario_apellido,
         u.dni AS usuario_dni,
         u.rol AS usuario_rol,
         c.nombre AS cliente_nombre,
         c.apellido AS cliente_apellido,
         c.email AS cliente_email
       FROM historial_actividad ha
       LEFT JOIN usuarios u ON ha.usuario_id = u.id
       LEFT JOIN clientes c ON ha.cliente_id = c.id
       ${whereSql}
       ORDER BY ha.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    rows.forEach((r) => {
      if (typeof r.datos === 'string') {
        try { r.datos = JSON.parse(r.datos); } catch { r.datos = null; }
      }
    });

    return rows;
  },

  // ============================================
  // ✅ RESUMEN DE CLIENTES CON COMPRAS REALES
  // Cuenta desde `ventas` + `pedidos_cliente`
  // ============================================
  async resumenClientes() {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.dni,
        c.tipo_cliente,
        c.puntos,
        c.created_at AS fecha_registro,
        c.ultimo_acceso,

        -- Total de compras (ventas + pedidos_cliente pagados)
        (
          COALESCE((
            SELECT COUNT(*)
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*)
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ), 0)
        ) AS total_pedidos,

        -- Total gastado
        (
          COALESCE((
            SELECT SUM(v.total)
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
          ), 0)
          +
          COALESCE((
            SELECT SUM(pc.total)
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ), 0)
        ) AS total_gastado,

        -- Última compra (la más reciente entre ventas y pedidos_cliente)
        (
          SELECT MAX(fecha) FROM (
            SELECT MAX(v.fecha_venta) AS fecha
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
            UNION ALL
            SELECT MAX(pc.created_at) AS fecha
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ) AS fechas
        ) AS ultima_compra

      FROM clientes c
      WHERE c.deleted_at IS NULL
        AND c.activo = TRUE
      ORDER BY total_gastado DESC, c.nombre ASC
    `);

    return rows.map(r => ({
      ...r,
      total_pedidos: Number(r.total_pedidos) || 0,
      total_gastado: Number(r.total_gastado) || 0,
      estado_compra: Number(r.total_pedidos) > 0 ? 'compro' : 'no_compro'
    }));
  },

  // ============================================
  // ✅ SOLO CLIENTES SIN COMPRAS
  // ============================================
  async clientesSinCompras() {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.dni,
        c.tipo_cliente,
        c.puntos,
        c.created_at AS fecha_registro,
        c.ultimo_acceso,
        0 AS total_pedidos,
        0 AS total_gastado,
        NULL AS ultima_compra,
        'no_compro' AS estado_compra
      FROM clientes c
      WHERE c.deleted_at IS NULL
        AND c.activo = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM ventas v
          WHERE v.cliente_id = c.id
            AND v.estado = 'completada'
            AND v.deleted_at IS NULL
        )
        AND NOT EXISTS (
          SELECT 1 FROM pedidos_cliente pc
          WHERE pc.cliente_id = c.id
            AND pc.pagado = TRUE
            AND pc.deleted_at IS NULL
        )
      ORDER BY c.created_at DESC
    `);
    return rows;
  },

  // ============================================
  // ✅ SOLO CLIENTES CON COMPRAS
  // ============================================
  async clientesConCompras() {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.dni,
        c.tipo_cliente,
        c.puntos,
        c.created_at AS fecha_registro,
        c.ultimo_acceso,

        (
          COALESCE((
            SELECT COUNT(*)
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*)
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ), 0)
        ) AS total_pedidos,

        (
          COALESCE((
            SELECT SUM(v.total)
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
          ), 0)
          +
          COALESCE((
            SELECT SUM(pc.total)
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ), 0)
        ) AS total_gastado,

        (
          SELECT MAX(fecha) FROM (
            SELECT MAX(v.fecha_venta) AS fecha
            FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
            UNION ALL
            SELECT MAX(pc.created_at) AS fecha
            FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          ) AS fechas
        ) AS ultima_compra,

        'compro' AS estado_compra

      FROM clientes c
      WHERE c.deleted_at IS NULL
        AND c.activo = TRUE
        AND (
          EXISTS (
            SELECT 1 FROM ventas v
            WHERE v.cliente_id = c.id
              AND v.estado = 'completada'
              AND v.deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1 FROM pedidos_cliente pc
            WHERE pc.cliente_id = c.id
              AND pc.pagado = TRUE
              AND pc.deleted_at IS NULL
          )
        )
      ORDER BY total_gastado DESC, c.nombre ASC
    `);

    return rows.map(r => ({
      ...r,
      total_pedidos: Number(r.total_pedidos) || 0,
      total_gastado: Number(r.total_gastado) || 0
    }));
  },

  // ============================================
  // ✅ DETALLE DE COMPRAS DE UN CLIENTE
  // Une ventas + pedidos_cliente ordenados por fecha
  // ============================================
  async getComprasByCliente(clienteId) {
    // Compras desde VENTAS (mesero/admin)
    const [ventas] = await db.query(`
      SELECT
        'venta' AS origen,
        v.id,
        v.items,
        v.subtotal,
        v.igv,
        v.total,
        v.metodo_pago,
        v.tipo_entrega,
        v.estado,
        v.fecha_venta AS fecha,
        v.cliente_nombre,
        u.nombre AS vendedor_nombre,
        u.apellido AS vendedor_apellido
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.cliente_id = ?
        AND v.estado = 'completada'
        AND v.deleted_at IS NULL
      ORDER BY v.fecha_venta DESC
    `, [clienteId]);

    // Compras desde PEDIDOS_CLIENTE (carta web)
    const [pedidos] = await db.query(`
      SELECT
        'pedido_cliente' AS origen,
        pc.id,
        pc.items,
        pc.subtotal,
        pc.igv,
        pc.total,
        pc.metodo_pago,
        pc.tipo_entrega,
        pc.estado,
        pc.created_at AS fecha,
        pc.cliente_nombre,
        NULL AS vendedor_nombre,
        NULL AS vendedor_apellido
      FROM pedidos_cliente pc
      WHERE pc.cliente_id = ?
        AND pc.pagado = TRUE
        AND pc.deleted_at IS NULL
      ORDER BY pc.created_at DESC
    `, [clienteId]);

    const parseItems = (row) => {
      if (typeof row.items === 'string') {
        try { row.items = JSON.parse(row.items); }
        catch { row.items = []; }
      }
      if (!Array.isArray(row.items)) row.items = [];
      return row;
    };

    return [
      ...ventas.map(parseItems),
      ...pedidos.map(parseItems)
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  // ============================================
  // USUARIOS ACTIVOS (personal del sistema)
  // ============================================
  async usuariosActivos() {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.rol,
        u.email,
        u.ultimo_acceso,
        COUNT(ha.id) AS total_sesiones,
        MAX(ha.created_at) AS ultima_sesion
      FROM usuarios u
      LEFT JOIN historial_actividad ha
        ON ha.usuario_id = u.id AND ha.accion = 'login_exitoso'
      WHERE u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY ultima_sesion DESC
    `);
    return rows;
  },

  // ============================================
  // ✅ ESTADÍSTICAS GENERALES
  // ============================================
  async estadisticas() {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM clientes WHERE deleted_at IS NULL AND activo = TRUE) AS total_clientes,

        (SELECT COUNT(*) FROM clientes c 
         WHERE c.deleted_at IS NULL 
           AND c.activo = TRUE
           AND (
             EXISTS (
               SELECT 1 FROM ventas v 
               WHERE v.cliente_id = c.id 
                 AND v.estado = 'completada' 
                 AND v.deleted_at IS NULL
             )
             OR EXISTS (
               SELECT 1 FROM pedidos_cliente pc 
               WHERE pc.cliente_id = c.id 
                 AND pc.pagado = TRUE 
                 AND pc.deleted_at IS NULL
             )
           )
        ) AS clientes_con_compras,

        (SELECT COUNT(*) FROM clientes c 
         WHERE c.deleted_at IS NULL 
           AND c.activo = TRUE
           AND NOT EXISTS (
             SELECT 1 FROM ventas v 
             WHERE v.cliente_id = c.id 
               AND v.estado = 'completada' 
               AND v.deleted_at IS NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM pedidos_cliente pc 
             WHERE pc.cliente_id = c.id 
               AND pc.pagado = TRUE 
               AND pc.deleted_at IS NULL
           )
        ) AS clientes_sin_compras,

        (SELECT COUNT(*) FROM historial_actividad WHERE accion = 'login_exitoso') AS total_logins,
        (SELECT COUNT(*) FROM historial_actividad WHERE accion = 'registro') AS total_registros,
        (SELECT COUNT(*) FROM historial_actividad WHERE DATE(created_at) = CURDATE()) AS actividad_hoy
    `);

    const stats = rows[0] || {};
    return {
      total_clientes: Number(stats.total_clientes) || 0,
      clientes_con_compras: Number(stats.clientes_con_compras) || 0,
      clientes_sin_compras: Number(stats.clientes_sin_compras) || 0,
      total_logins: Number(stats.total_logins) || 0,
      total_registros: Number(stats.total_registros) || 0,
      actividad_hoy: Number(stats.actividad_hoy) || 0
    };
  }
};

module.exports = HistorialActividad;