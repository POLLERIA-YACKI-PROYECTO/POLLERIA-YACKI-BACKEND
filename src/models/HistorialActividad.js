// src/models/HistorialActividad.js
const db = require('../config/database');

const HistorialActividad = {
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

  async resumenClientes() {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.nombre,
        c.apellido,
        c.email,
        c.telefono,
        c.tipo_cliente,
        c.puntos,
        c.created_at AS fecha_registro,
        c.ultimo_acceso,
        COUNT(DISTINCT p.id) AS total_pedidos,
        COALESCE(SUM(p.total), 0) AS total_gastado,
        MAX(p.created_at) AS ultima_compra,
        CASE
          WHEN COUNT(DISTINCT p.id) > 0 THEN 'compro'
          ELSE 'no_compro'
        END AS estado_compra
      FROM clientes c
      LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado != 'cancelado'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  },

  async clientesSinCompras() {
    const [rows] = await db.query(`
      SELECT
        c.id, c.nombre, c.apellido, c.email, c.telefono,
        c.created_at AS fecha_registro,
        c.ultimo_acceso
      FROM clientes c
      WHERE c.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM pedidos p
          WHERE p.cliente_id = c.id AND p.estado != 'cancelado'
        )
      ORDER BY c.created_at DESC
    `);
    return rows;
  },

  async clientesConCompras() {
    const [rows] = await db.query(`
      SELECT
        c.id, c.nombre, c.apellido, c.email, c.telefono,
        c.tipo_cliente, c.puntos,
        COUNT(DISTINCT p.id) AS total_pedidos,
        COALESCE(SUM(p.total), 0) AS total_gastado,
        MAX(p.created_at) AS ultima_compra
      FROM clientes c
      INNER JOIN pedidos p ON p.cliente_id = c.id AND p.estado != 'cancelado'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY total_gastado DESC
    `);
    return rows;
  },

  async usuariosActivos() {
    const [rows] = await db.query(`
      SELECT
        u.id, u.nombre, u.apellido, u.dni, u.rol, u.email, u.ultimo_acceso,
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

  async estadisticas() {
    const [rows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM clientes WHERE deleted_at IS NULL) AS total_clientes,
        (SELECT COUNT(*) FROM clientes c WHERE deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id AND p.estado != 'cancelado')
        ) AS clientes_sin_compras,
        (SELECT COUNT(*) FROM clientes c WHERE deleted_at IS NULL
          AND EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id AND p.estado != 'cancelado')
        ) AS clientes_con_compras,
        (SELECT COUNT(*) FROM historial_actividad WHERE accion = 'login_exitoso') AS total_logins,
        (SELECT COUNT(*) FROM historial_actividad WHERE accion = 'registro') AS total_registros,
        (SELECT COUNT(*) FROM historial_actividad WHERE DATE(created_at) = CURDATE()) AS actividad_hoy
    `);
    return rows[0];
  }
};

module.exports = HistorialActividad;