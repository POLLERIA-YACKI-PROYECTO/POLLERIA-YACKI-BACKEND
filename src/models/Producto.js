// src/models/Producto.js

const db = require('../config/database');

class Producto {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.disponible = true
      ORDER BY c.orden, p.nombre
    `);
    return rows;
  }

  static async findByCategoria(categoriaId) {
    const [rows] = await db.query(
      'SELECT * FROM productos WHERE categoria_id = ? AND disponible = true ORDER BY nombre',
      [categoriaId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(producto) {
    const { categoria_id, nombre, precio, descripcion } = producto;
    const [result] = await db.query(
      'INSERT INTO productos (categoria_id, nombre, precio, descripcion) VALUES (?, ?, ?, ?)',
      [categoria_id, nombre, precio, descripcion || null]
    );
    return { id: result.insertId, ...producto };
  }

  static async update(id, producto) {
    const { nombre, precio, descripcion, categoria_id } = producto;
    const [result] = await db.query(
      'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, categoria_id = ? WHERE id = ?',
      [nombre, precio, descripcion || null, categoria_id, id]
    );
    return result.affectedRows > 0;
  }

  static async toggleAgotado(id) {
    const [product] = await db.query('SELECT agotado FROM productos WHERE id = ?', [id]);
    if (product.length === 0) return null;
    const nuevoEstado = !product[0].agotado;
    await db.query('UPDATE productos SET agotado = ? WHERE id = ?', [nuevoEstado, id]);
    return nuevoEstado;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE productos SET disponible = false WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Producto;