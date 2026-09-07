// src/models/Configuracion.js
const db = require('../config/database');
const { logger } = require('../utils/logger');

class Configuracion {
  static async findAll() {
    try {
      const [rows] = await db.query(
        'SELECT id, clave, valor, tipo, descripcion, updated_at FROM configuracion WHERE deleted_at IS NULL ORDER BY clave'
      );
      return rows;
    } catch (error) {
      logger.error('Error en findAll configuracion:', error);
      throw error;
    }
  }

  static async findByClave(clave) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM configuracion WHERE clave = ? AND deleted_at IS NULL',
        [clave]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error en findByClave configuracion:', error);
      throw error;
    }
  }

  static async update(clave, valor) {
    try {
      const [result] = await db.query(
        'UPDATE configuracion SET valor = ?, updated_at = NOW() WHERE clave = ? AND deleted_at IS NULL',
        [valor, clave]
      );
      if (result.affectedRows > 0) {
        logger.info(`Configuración actualizada: ${clave} = ${valor}`);
      }
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en update configuracion:', error);
      throw error;
    }
  }

  static async create(config) {
    try {
      const { clave, valor, tipo, descripcion } = config;
      const [result] = await db.query(
        'INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES (?, ?, ?, ?)',
        [clave, valor, tipo || 'texto', descripcion || null]
      );
      logger.info(`Configuración creada: ${clave}`);
      return { id: result.insertId, ...config };
    } catch (error) {
      logger.error('Error en create configuracion:', error);
      throw error;
    }
  }

  static async delete(clave) {
    try {
      const [result] = await db.query(
        'UPDATE configuracion SET deleted_at = NOW() WHERE clave = ?',
        [clave]
      );
      if (result.affectedRows > 0) {
        logger.info(`Configuración eliminada: ${clave}`);
      }
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en delete configuracion:', error);
      throw error;
    }
  }
}

module.exports = Configuracion;