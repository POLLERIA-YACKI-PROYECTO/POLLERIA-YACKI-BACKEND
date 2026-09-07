// src/models/Producto.js
const db = require('../config/database');
const { DEFAULT_IMAGE_NAME } = require('../config/default-image');

class Producto {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY c.orden, p.nombre
    `);
    return rows;
  }

  static async findAvailable() {
    const [rows] = await db.query(`
      SELECT * FROM productos 
      WHERE disponible = 1 AND agotado = 0 AND deleted_at IS NULL
      ORDER BY nombre ASC
    `);
    return rows;
  }

  static async findByCategoria(categoriaId) {
    const [rows] = await db.query(`
      SELECT * FROM productos 
      WHERE categoria_id = ? AND disponible = 1 AND agotado = 0 AND deleted_at IS NULL
      ORDER BY nombre ASC
    `, [categoriaId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT * FROM productos WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    return rows[0];
  }

  static async create(producto) {
    const { 
      categoria_id, nombre, precio, descripcion, stock, 
      disponible, agotado, imagen 
    } = producto;
    
    // ✅ Si no hay imagen, usar la imagen por defecto
    const imagenFinal = imagen || DEFAULT_IMAGE_NAME;
    
    const [result] = await db.query(
      `INSERT INTO productos 
       (categoria_id, nombre, precio, descripcion, stock, disponible, agotado, imagen) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoria_id, nombre, precio, descripcion || null, 
        stock || 0, disponible !== undefined ? (disponible ? 1 : 0) : 1,
        agotado !== undefined ? (agotado ? 1 : 0) : 0,
        imagenFinal
      ]
    );
    return { id: result.insertId, ...producto, imagen: imagenFinal };
  }

  static async update(id, producto) {
    const { 
      nombre, precio, descripcion, categoria_id, stock, 
      disponible, agotado, imagen 
    } = producto;
    
    // ✅ Si no se especifica imagen, mantener la actual
    let imagenFinal = imagen;
    if (!imagenFinal) {
      const existing = await this.findById(id);
      imagenFinal = existing?.imagen || DEFAULT_IMAGE_NAME;
    }
    
    const [result] = await db.query(
      `UPDATE productos 
       SET nombre = ?, precio = ?, descripcion = ?, categoria_id = ?, 
           stock = ?, disponible = ?, agotado = ?, imagen = ?,
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [
        nombre, precio, descripcion || null, categoria_id, 
        stock || 0, disponible !== undefined ? (disponible ? 1 : 0) : 1,
        agotado !== undefined ? (agotado ? 1 : 0) : 0,
        imagenFinal, id
      ]
    );
    return result.affectedRows > 0;
  }

  static async updateImage(id, imagen) {
    const [result] = await db.query(
      'UPDATE productos SET imagen = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [imagen, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      'UPDATE productos SET deleted_at = NOW(), disponible = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Producto;