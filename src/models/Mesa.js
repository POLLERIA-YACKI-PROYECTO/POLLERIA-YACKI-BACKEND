// src/models/Mesa.js
const db = require('../config/database');

class Mesa {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT * FROM mesas 
      WHERE deleted_at IS NULL 
      ORDER BY numero ASC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT * FROM mesas 
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    return rows[0];
  }

  static async findByNumero(numero) {
    const [rows] = await db.query(`
      SELECT * FROM mesas 
      WHERE numero = ? AND deleted_at IS NULL
    `, [numero]);
    return rows[0];
  }

  static async create(mesa) {
    const { numero, capacidad, ubicacion } = mesa;
    const [result] = await db.query(
      `INSERT INTO mesas (numero, capacidad, ubicacion) 
       VALUES (?, ?, ?)`,
      [numero, capacidad || 4, ubicacion || 'Sala Principal']
    );
    return { id: result.insertId, ...mesa };
  }

  static async ocuparMesa(numero, cliente, cantidad_personas = 0) {
    const [result] = await db.query(
      `UPDATE mesas 
       SET ocupada = true, 
           cliente = ?, 
           cantidad_personas = ?,
           hora_ocupacion = NOW() 
       WHERE numero = ? AND ocupada = false`,
      [cliente || 'Cliente', cantidad_personas, numero]
    );
    return result.affectedRows > 0;
  }

  static async liberarMesa(numero) {
    const [result] = await db.query(
      `UPDATE mesas 
       SET ocupada = false, 
           cliente = NULL, 
           cantidad_personas = 0,
           hora_ocupacion = NULL 
       WHERE numero = ?`,
      [numero]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      'UPDATE mesas SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Mesa;