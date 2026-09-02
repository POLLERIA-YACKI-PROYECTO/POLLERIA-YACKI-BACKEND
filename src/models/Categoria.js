// src/models/Categoria.js

const db = require('../config/database');

class Categoria {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM categorias WHERE activo = true ORDER BY orden');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(categoria) {
    const { nombre, icono, orden } = categoria;
    const [result] = await db.query(
      'INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)',
      [nombre, icono || null, orden || 0]
    );
    return { id: result.insertId, ...categoria };
  }

  static async update(id, categoria) {
    const { nombre, icono, orden, activo } = categoria;
    const [result] = await db.query(
      'UPDATE categorias SET nombre = ?, icono = ?, orden = ?, activo = ? WHERE id = ?',
      [nombre, icono || null, orden || 0, activo !== undefined ? activo : true, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE categorias SET activo = false WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Categoria;