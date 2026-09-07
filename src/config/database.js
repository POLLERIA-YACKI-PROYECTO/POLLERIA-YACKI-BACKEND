// src/config/database.js
const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

// Pool de conexiones con configuración segura
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'adrian.200503',
  database: process.env.DB_NAME || 'polleria_yacky',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timeouts para prevenir conexiones colgadas
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 60000
});

// Función de query segura con logging
const query = async (sql, params = []) => {
  const startTime = Date.now();
  try {
    // Sanitizar parámetros adicionalmente
    const sanitizedParams = params.map(p => {
      if (typeof p === 'string') {
        // Prevenir caracteres peligrosos
        return p.replace(/['";\\]/g, '');
      }
      return p;
    });

    const [rows] = await pool.query(sql, sanitizedParams);
    
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn(`⚠️ Query lenta (${duration}ms): ${sql.substring(0, 100)}...`);
    }
    
    return [rows];
  } catch (error) {
    logger.error(`❌ Error en query: ${error.message}`);
    logger.error(`SQL: ${sql}`);
    logger.error(`Params: ${JSON.stringify(params)}`);
    throw new Error('Error en la base de datos');
  }
};

// Función para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('❌ Transacción fallida:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction
};