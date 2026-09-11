// src/models/Cliente.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Cliente {
  static async findAll() {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, dni, telefono, email, direccion,
              tipo_cliente, puntos, activo, ultimo_acceso, created_at
       FROM clientes
       WHERE deleted_at IS NULL
       ORDER BY id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, dni, telefono, email, direccion,
              tipo_cliente, puntos, activo, ultimo_acceso, created_at
       FROM clientes
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByDni(dni) {
    const [rows] = await db.query(
      'SELECT * FROM clientes WHERE dni = ? AND deleted_at IS NULL',
      [dni]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM clientes WHERE email = ? AND deleted_at IS NULL LIMIT 1',
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
      `INSERT INTO clientes
        (nombre, apellido, dni, telefono, email, direccion, password, tipo_cliente, puntos, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'regular', 0, TRUE)`,
      [
        nombre,
        apellido || null,
        dni || null,
        telefono || null,
        email || null,
        direccion || null,
        hashedPassword
      ]
    );

    return this.findById(result.insertId);
  }

  static async update(id, cliente) {
    const { nombre, apellido, dni, telefono, email, direccion } = cliente;
    const [result] = await db.query(
      `UPDATE clientes
       SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, direccion = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [nombre, apellido, dni, telefono, email, direccion, id]
    );
    return result.affectedRows > 0;
  }

  static async updateUltimoAcceso(id) {
    await db.query(
      'UPDATE clientes SET ultimo_acceso = NOW() WHERE id = ?',
      [id]
    );
  }

  static async delete(id) {
    const [result] = await db.query(
      'UPDATE clientes SET deleted_at = NOW(), activo = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async buscar(termino) {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, dni, telefono, email, direccion
       FROM clientes
       WHERE (nombre LIKE ? OR dni LIKE ? OR email LIKE ?)
         AND deleted_at IS NULL
       ORDER BY nombre ASC`,
      [`%${termino}%`, `%${termino}%`, `%${termino}%`]
    );
    return rows;
  }
}

module.exports = Cliente;