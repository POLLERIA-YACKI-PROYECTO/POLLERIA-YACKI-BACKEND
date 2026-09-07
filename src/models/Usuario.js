// src/models/Usuario.js
const db = require('../config/database');
const { logger } = require('../utils/logger');

class Usuario {
  static async findAll() {
    try {
      const [rows] = await db.query(
        'SELECT id, nombre, apellido, dni, rol, telefono, email, activo, created_at, fecha_contratacion, salario FROM usuarios WHERE activo = 1 AND deleted_at IS NULL ORDER BY id DESC'
      );
      return rows;
    } catch (error) {
      logger.error('Error en findAll usuarios:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query(
        'SELECT id, nombre, apellido, dni, rol, telefono, email, activo, created_at, fecha_contratacion, salario FROM usuarios WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error en findById usuarios:', error);
      throw error;
    }
  }

  static async findByDni(dni) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM usuarios WHERE dni = ? AND activo = 1 AND deleted_at IS NULL',
        [dni]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error en findByDni usuarios:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM usuarios WHERE email = ? AND activo = 1 AND deleted_at IS NULL',
        [email]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error en findByEmail usuarios:', error);
      throw error;
    }
  }

  static async create(usuario) {
    try {
      const { nombre, apellido, dni, rol, telefono, email, password, fecha_contratacion, salario } = usuario;
      const [result] = await db.query(
        `INSERT INTO usuarios 
         (nombre, apellido, dni, rol, telefono, email, password, fecha_contratacion, salario) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, apellido || null, dni, rol || 'mesero', telefono || null, email || null, password || '123456', fecha_contratacion || null, salario || null]
      );
      logger.info(`Usuario creado: ${nombre} (${dni})`);
      return { id: result.insertId, ...usuario };
    } catch (error) {
      logger.error('Error en create usuarios:', error);
      throw error;
    }
  }

  static async update(id, usuario) {
    try {
      const { nombre, apellido, dni, rol, telefono, email, activo, fecha_contratacion, salario } = usuario;
      const [result] = await db.query(
        `UPDATE usuarios 
         SET nombre = ?, apellido = ?, dni = ?, rol = ?, telefono = ?, email = ?, activo = ?, fecha_contratacion = ?, salario = ? 
         WHERE id = ? AND deleted_at IS NULL`,
        [nombre, apellido, dni, rol, telefono, email, activo, fecha_contratacion, salario, id]
      );
      if (result.affectedRows > 0) {
        logger.info(`Usuario actualizado: ID ${id}`);
      }
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en update usuarios:', error);
      throw error;
    }
  }

  static async updatePassword(id, password) {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET password = ? WHERE id = ? AND deleted_at IS NULL',
        [password, id]
      );
      if (result.affectedRows > 0) {
        logger.info(`Contraseña actualizada para usuario ID ${id}`);
      }
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en updatePassword usuarios:', error);
      throw error;
    }
  }

  static async updateLastAccess(id) {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en updateLastAccess usuarios:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET activo = false, deleted_at = NOW() WHERE id = ?',
        [id]
      );
      if (result.affectedRows > 0) {
        logger.info(`Usuario eliminado (soft delete): ID ${id}`);
      }
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en delete usuarios:', error);
      throw error;
    }
  }

  static async findByRol(rol) {
    try {
      const [rows] = await db.query(
        'SELECT id, nombre, apellido, dni, rol, telefono, email, activo FROM usuarios WHERE rol = ? AND activo = 1 AND deleted_at IS NULL',
        [rol]
      );
      return rows;
    } catch (error) {
      logger.error('Error en findByRol usuarios:', error);
      throw error;
    }
  }

  static async buscar(termino) {
    try {
      const [rows] = await db.query(
        `SELECT id, nombre, apellido, dni, rol, telefono, email, activo 
         FROM usuarios 
         WHERE (nombre LIKE ? OR dni LIKE ? OR email LIKE ?) 
           AND activo = 1 AND deleted_at IS NULL
         ORDER BY nombre ASC`,
        [`%${termino}%`, `%${termino}%`, `%${termino}%`]
      );
      return rows;
    } catch (error) {
      logger.error('Error en buscar usuarios:', error);
      throw error;
    }
  }
}

module.exports = Usuario;