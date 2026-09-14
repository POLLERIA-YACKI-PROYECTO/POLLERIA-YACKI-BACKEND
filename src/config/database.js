// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'adrian200503',
  database: process.env.DB_NAME || 'polleria_yacki',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  idleTimeout: 60000,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const value = field.string('utf8');
      if (value === null || value === undefined) return null;
      try {
        return JSON.parse(value);
      } catch (err) {
        console.error('Error al parsear JSON:', err.message);
        return value;
      }
    }
    return next();
  }
});

pool.on('acquire', () => {
  if (process.env.NODE_ENV !== 'production') {
    const total = pool.pool?._allConnections?.length ?? '?';
    const free = pool.pool?._freeConnections?.length ?? '?';
    const queue = pool.pool?._connectionQueue?.length ?? '?';
    console.log(`[DB] acquire | total:${total} free:${free} queue:${queue}`);
  }
});

pool.on('release', () => {
  if (process.env.NODE_ENV !== 'production') {
    const total = pool.pool?._allConnections?.length ?? '?';
    const free = pool.pool?._freeConnections?.length ?? '?';
    console.log(`[DB] release | total:${total} free:${free}`);
  }
});

pool.on('enqueue', () => {
  const queue = pool.pool?._connectionQueue?.length ?? '?';
  if (queue > 5) {
    console.warn(`[DB] ⚠️  Cola de conexiones: ${queue} peticiones esperando`);
  }
});

pool.query('SELECT 1')
  .then(() => console.log('[DB] ✅ Pool conectado correctamente'))
  .catch((err) => console.error('[DB] ❌ Error conectando al pool:', err.message));

module.exports = pool;