const db = require('../config/database');

class Usuario {
  static async findAll() {
    const [rows] = await db.query('SELECT id, nombre, dni, rol, telefono, activo, created_at FROM usuarios');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT id, nombre, dni, rol, telefono, activo, created_at FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByDni(dni) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE dni = ?', [dni]);
    return rows[0];
  }

  static async create(usuario) {
    const { nombre, dni, rol, telefono, password } = usuario;
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, dni, rol, telefono, password) VALUES (?, ?, ?, ?, ?)',
      [nombre, dni, rol || 'mesero', telefono || null, password]
    );
    return { id: result.insertId, ...usuario };
  }

  static async update(id, usuario) {
    const { nombre, dni, rol, telefono, activo } = usuario;
    const [result] = await db.query(
      'UPDATE usuarios SET nombre = ?, dni = ?, rol = ?, telefono = ?, activo = ? WHERE id = ?',
      [nombre, dni, rol, telefono, activo, id]
    );
    return result.affectedRows > 0;
  }

  static async updatePassword(id, password) {
    const [result] = await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [password, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE usuarios SET activo = false WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Usuario;