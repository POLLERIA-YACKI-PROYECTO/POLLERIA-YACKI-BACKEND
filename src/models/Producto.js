// src/models/Producto.js

const db = require('../config/database');

class Producto {
  static async findAll() {
    // ✅ CORREGIDO: No filtrar solo disponibles, mostrar TODOS
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY c.orden, p.nombre
    `);
    return rows;
  }

  static async findAvailable() {
    // ✅ NUEVO: Solo productos disponibles
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.disponible = 1 AND p.agotado = 0
      ORDER BY c.orden, p.nombre
    `);
    return rows;
  }

  static async findByCategoria(categoriaId) {
    // ✅ CORREGIDO: Mostrar todos los productos de la categoría
    const [rows] = await db.query(`
      SELECT * FROM productos 
      WHERE categoria_id = ?
      ORDER BY nombre ASC
    `, [categoriaId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(producto) {
    const { categoria_id, nombre, precio, descripcion, stock, disponible, agotado } = producto;
    const [result] = await db.query(
      `INSERT INTO productos 
       (categoria_id, nombre, precio, descripcion, stock, disponible, agotado) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [categoria_id, nombre, precio, descripcion || null, stock || 0, disponible !== undefined ? (disponible ? 1 : 0) : 1, agotado !== undefined ? (agotado ? 1 : 0) : 0]
    );
    return { id: result.insertId, ...producto };
  }

  static async update(id, producto) {
    const { nombre, precio, descripcion, categoria_id, stock, disponible, agotado } = producto;
    const [result] = await db.query(
      `UPDATE productos 
       SET nombre = ?, precio = ?, descripcion = ?, categoria_id = ?, 
           stock = ?, disponible = ?, agotado = ?
       WHERE id = ?`,
      [nombre, precio, descripcion || null, categoria_id, stock || 0, 
       disponible !== undefined ? (disponible ? 1 : 0) : 1, 
       agotado !== undefined ? (agotado ? 1 : 0) : 0, id]
    );
    return result.affectedRows > 0;
  }

  static async toggleAgotado(id) {
    const [product] = await db.query('SELECT agotado FROM productos WHERE id = ?', [id]);
    if (product.length === 0) return null;
    const nuevoEstado = !product[0].agotado;
    await db.query('UPDATE productos SET agotado = ? WHERE id = ?', [nuevoEstado ? 1 : 0, id]);
    return nuevoEstado;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE productos SET disponible = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async destroy(id) {
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Producto;