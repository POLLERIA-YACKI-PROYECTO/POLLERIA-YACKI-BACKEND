// src/models/Cliente.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Cliente {
  static async findAll() {
    const [rows] = await db.query(
            `SELECT id, nombre, apellido, dni, telefono,
              email, direccion, 'regular' AS tipo_cliente, 0 AS puntos,
              activo, ultimo_acceso, created_at
             FROM usuarios
             WHERE rol = 'cliente' AND deleted_at IS NULL
           ORDER BY id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
            `SELECT id, nombre, apellido, dni, telefono,
              email, direccion, 'regular' AS tipo_cliente, 0 AS puntos,
              activo, ultimo_acceso, created_at
         FROM usuarios
         WHERE id = ? AND rol = 'cliente' AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByDni(dni) {
    const [rows] = await db.query(
            `SELECT id, nombre, apellido, dni, telefono, email, direccion,
              password, activo
         FROM usuarios WHERE dni = ? AND rol = 'cliente' AND deleted_at IS NULL`,
      [dni]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
            `SELECT id, nombre, apellido, dni, telefono, email, direccion,
              password, activo, ultimo_acceso, created_at
         FROM usuarios WHERE email = ? AND rol = 'cliente' AND deleted_at IS NULL LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async create(cliente) {
    const { nombre, apellido, dni, telefono, email, direccion, password } = cliente;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash('123456', 10);

    const [result] = await db.query(
      `INSERT INTO usuarios
        (nombre, apellido, dni, telefono, email, direccion, password, rol, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente', TRUE)`,
      [nombre, apellido || null, dni || null, telefono || null, email || null, direccion || null, hashedPassword]
    );

    return this.findById(result.insertId);
  }

  static async update(id, cliente) {
    const { nombre, apellido, dni, telefono, email, direccion } = cliente;
    const [result] = await db.query(
      `UPDATE usuarios
       SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, direccion = ?
       WHERE id = ? AND rol = 'cliente' AND deleted_at IS NULL`,
      [nombre, cliente.apellido || null, dni, telefono, email, cliente.direccion || null, id]
    );
    return result.affectedRows > 0;
  }

  static async updateUltimoAcceso(id) {
    return;
  }

  static async delete(id) {
    const [result] = await db.query(
      "UPDATE usuarios SET activo = FALSE, deleted_at = NOW() WHERE id = ? AND rol = 'cliente'",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async buscar(termino) {
    const [rows] = await db.query(
            `SELECT id, nombre, apellido, dni,
              telefono, email, direccion
         FROM usuarios
         WHERE rol = 'cliente' AND deleted_at IS NULL
         AND (nombre LIKE ? OR dni LIKE ? OR email LIKE ?)
       ORDER BY nombre ASC`,
      [`%${termino}%`, `%${termino}%`, `%${termino}%`]
    );
    return rows;
  }
}

module.exports = Cliente;