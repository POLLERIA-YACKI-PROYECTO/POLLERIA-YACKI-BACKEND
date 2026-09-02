// src/models/Mesa.js

const db = require('../config/database');

class Mesa {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM mesas ORDER BY numero ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM mesas WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByNumero(numero) {
    const [rows] = await db.query('SELECT * FROM mesas WHERE numero = ?', [numero]);
    return rows[0];
  }

  static async create(mesa) {
    const { numero, capacidad } = mesa;
    const [result] = await db.query(
      'INSERT INTO mesas (numero, capacidad) VALUES (?, ?)',
      [numero, capacidad || 4]
    );
    return { id: result.insertId, ...mesa };
  }

  static async ocuparMesa(numero, cliente) {
    const [result] = await db.query(
      'UPDATE mesas SET ocupada = true, cliente = ? WHERE numero = ? AND ocupada = false',
      [cliente || 'Cliente', numero]
    );
    return result.affectedRows > 0;
  }

  static async liberarMesa(numero) {
    const [result] = await db.query(
      'UPDATE mesas SET ocupada = false, cliente = NULL WHERE numero = ?',
      [numero]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM mesas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Mesa;