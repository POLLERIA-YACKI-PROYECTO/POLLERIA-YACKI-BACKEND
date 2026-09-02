// src/models/Cliente.js
const db = require('../config/database');

class Cliente {
  static async findAll() {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, dni, telefono, email, direccion, created_at FROM clientes ORDER BY id DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, dni, telefono, email, direccion, created_at FROM clientes WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByDni(dni) {
    const [rows] = await db.query('SELECT * FROM clientes WHERE dni = ?', [dni]);
    return rows[0];
  }

  static async create(cliente) {
    const { nombre, apellido, dni, telefono, email, direccion } = cliente;
    const [result] = await db.query(
      `INSERT INTO clientes (nombre, apellido, dni, telefono, email, direccion) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellido || null, dni || null, telefono || null, email || null, direccion || null]
    );
    return { id: result.insertId, ...cliente };
  }

  static async update(id, cliente) {
    const { nombre, apellido, dni, telefono, email, direccion } = cliente;
    const [result] = await db.query(
      `UPDATE clientes 
       SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, direccion = ? 
       WHERE id = ?`,
      [nombre, apellido, dni, telefono, email, direccion, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM clientes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async buscar(termino) {
    const [rows] = await db.query(
      `SELECT id, nombre, apellido, dni, telefono, email, direccion 
       FROM clientes 
       WHERE nombre LIKE ? OR dni LIKE ? 
       ORDER BY nombre ASC`,
      [`%${termino}%`, `%${termino}%`]
    );
    return rows;
  }
}

module.exports = Cliente;