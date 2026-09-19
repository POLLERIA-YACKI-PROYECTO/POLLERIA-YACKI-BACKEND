// src/config/database.js
const mysql = require('mysql2/promise');

if (!process.env.DB_HOST) {
  require('dotenv').config();
}

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production';

// ============================================
// POOL - Configuración
// ============================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'adrian.200503',
  database: process.env.DB_NAME || 'polleria_yacki',
  port: process.env.DB_PORT || 3306,

  // Pool
  waitForConnections: true,
  connectionLimit: isTest ? 2 : 20,   // en tests, mínimo
  maxIdle: isTest ? 2 : 20,
  idleTimeout: 60000,
  queueLimit: 0,

  // Timeouts
  connectTimeout: 10000,
  // acquireTimeout ELIMINADO: no existe en mysql2 (era solo warning, será error)

  // Keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,

  charset: 'utf8mb4',
  timezone: 'local',
  dateStrings: false,

  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const value = field.string('utf8');
      if (value === null || value === undefined) return null;
      try {
        return JSON.parse(value);
      } catch (err) {
        console.error('[DB] Error al parsear JSON:', err.message);
        return value;
      }
    }
    return next();
  }
});

// ============================================
// WARM-UP (solo fuera de tests)
// ============================================
async function warmUpPool() {
  if (isTest) return;
  console.log('[DB] Calentando pool (abriendo 5 conexiones)...');
  const connections = [];
  try {
    for (let i = 0; i < 5; i++) {
      const conn = await pool.getConnection();
      connections.push(conn);
    }
    console.log(`[DB] Pool caliente: ${connections.length} conexiones abiertas`);
  } catch (err) {
    console.error('[DB] Error en warm-up:', err.message);
  } finally {
    connections.forEach((conn) => {
      try { conn.release(); } catch (e) { /* ignore */ }
    });
  }
}

// ============================================
// LOGS (solo en dev, no en test)
// ============================================
if (isDev && !isTest) {
  pool.on('enqueue', () => {
    const queue = pool.pool?._connectionQueue?.length ?? 0;
    if (queue > 3) {
      console.warn(`[DB] Cola de conexiones: ${queue} peticiones esperando`);
    }
  });

  pool.on('acquire', () => {
    const free = pool.pool?._freeConnections?.length ?? 0;
    const total = pool.pool?._allConnections?.length ?? 0;
    if (free === 0 && total >= 3) {
      console.warn(`[DB] Pool saturado | total:${total} free:0`);
    }
  });
}

// ============================================
// ERROR HANDLER
// ============================================
pool.on('error', (err) => {
  console.error('[DB] Error en pool MySQL:', err.code || err.message);
});

// ============================================
// EXPORTAR
// ============================================
module.exports = pool;

// ============================================
// CONEXIÓN INICIAL (NO ejecutar en tests)
// ============================================
if (!isTest) {
  pool
    .query('SELECT 1')
    .then(() => {
      console.log('[DB] Pool conectado correctamente');
      return warmUpPool();
    })
    .catch((err) => console.error('[DB] Error conectando al pool:', err.message));
}