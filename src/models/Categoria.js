// src/models/Categoria.js

const db = require('../config/database');

class Categoria {
  static async findAll() {
    // Obtener TODAS las categorías activas con conteo de productos
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) as total_productos,
        SUM(CASE WHEN p.disponible = 1 AND p.agotado = 0 THEN 1 ELSE 0 END) as productos_disponibles
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id
      WHERE c.activo = 1
      GROUP BY c.id, c.nombre, c.icono, c.descripcion, c.orden, c.activo, c.created_at, c.updated_at
      ORDER BY c.orden ASC, c.id ASC
    `);
    return rows;
  }

  static async findActive() {
    // Solo categorías con productos disponibles
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) as total_productos,
        SUM(CASE WHEN p.disponible = 1 AND p.agotado = 0 THEN 1 ELSE 0 END) as productos_disponibles
      FROM categorias c
      INNER JOIN productos p ON c.id = p.categoria_id
      WHERE c.activo = 1
        AND p.disponible = 1 
        AND p.agotado = 0
      GROUP BY c.id, c.nombre, c.icono, c.descripcion, c.orden, c.activo, c.created_at, c.updated_at
      HAVING productos_disponibles > 0
      ORDER BY c.orden ASC, c.id ASC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) as total_productos
      FROM categorias c
      LEFT JOIN productos p ON c.id = p.categoria_id
      WHERE c.id = ?
      GROUP BY c.id, c.nombre, c.icono, c.descripcion, c.orden, c.activo, c.created_at, c.updated_at
    `, [id]);
    return rows[0];
  }

  // ✅ NUEVO: Obtener productos por categoría
  static async getProductosByCategoria(categoriaId) {
    const [rows] = await db.query(`
      SELECT * FROM productos 
      WHERE categoria_id = ? 
        AND disponible = 1 
        AND agotado = 0
      ORDER BY nombre ASC
    `, [categoriaId]);
    return rows;
  }

  static async create(categoria) {
    const { nombre, icono, orden, descripcion } = categoria;
    const [result] = await db.query(
      'INSERT INTO categorias (nombre, icono, orden, descripcion, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, icono || null, orden || 0, descripcion || null, 1]
    );
    return { id: result.insertId, ...categoria, activo: 1 };
  }

  static async update(id, categoria) {
    const { nombre, icono, orden, activo, descripcion } = categoria;
    const [result] = await db.query(
      `UPDATE categorias 
       SET nombre = ?, icono = ?, orden = ?, activo = ?, descripcion = ?
       WHERE id = ?`,
      [nombre, icono || null, orden || 0, activo !== undefined ? (activo ? 1 : 0) : 1, descripcion || null, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('UPDATE categorias SET activo = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async destroy(id) {
    const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Categoria;