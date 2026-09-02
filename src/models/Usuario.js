// src/models/Usuario.js
const db = require('../config/database');

class Usuario {
  static async findAll() {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, dni, rol, telefono, email, activo, created_at, fecha_contratacion, salario FROM usuarios WHERE activo = 1 ORDER BY id DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, dni, rol, telefono, email, activo, created_at, fecha_contratacion, salario FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByDni(dni) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE dni = ? AND activo = 1', [dni]);
    return rows[0];
  }

  static async create(usuario) {
    const { nombre, apellido, dni, rol, telefono, email, password, fecha_contratacion, salario } = usuario;
    const [result] = await db.query(
      `INSERT INTO usuarios 
       (nombre, apellido, dni, rol, telefono, email, password, fecha_contratacion, salario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido || null, dni, rol || 'mesero', telefono || null, email || null, password || '123456', fecha_contratacion || null, salario || null]
    );
    return { id: result.insertId, ...usuario };
  }

  static async update(id, usuario) {
    const { nombre, apellido, dni, rol, telefono, email, activo, fecha_contratacion, salario } = usuario;
    const [result] = await db.query(
      `UPDATE usuarios 
       SET nombre = ?, apellido = ?, dni = ?, rol = ?, telefono = ?, email = ?, activo = ?, fecha_contratacion = ?, salario = ? 
       WHERE id = ?`,
      [nombre, apellido, dni, rol, telefono, email, activo, fecha_contratacion, salario, id]
    );
    return result.affectedRows > 0;
  }

  static async updatePassword(id, password) {
    const [result] = await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [password, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // Soft delete - solo desactivar
    const [result] = await db.query('UPDATE usuarios SET activo = false WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Obtener usuarios por rol
  static async findByRol(rol) {
    const [rows] = await db.query(
      'SELECT id, nombre, apellido, dni, rol, telefono, email, activo FROM usuarios WHERE rol = ? AND activo = 1',
      [rol]
    );
    return rows;
  }
}

module.exports = Usuario;