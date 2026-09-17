// src/config/database.js
const mysql = require('mysql2/promise');

if (!process.env.DB_HOST) {
  require('dotenv').config();
}

// ============================================
// POOL - Forzar mínimo de conexiones
// ============================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'adrian.200503',
  database: process.env.DB_NAME || 'polleria_yacki',
  port: process.env.DB_PORT || 3306,

  // CRÍTICO: Forzar que el pool abra más conexiones
  waitForConnections: true,
  connectionLimit: 20,      // máximo 20 conexiones
  maxIdle: 20,              // mantener hasta 20 idle
  idleTimeout: 60000,       // cerrar idle a los 60s
  queueLimit: 0,            // sin límite de cola

  // Timeouts
  connectTimeout: 10000,
  acquireTimeout: 15000,    // AÑADIR: timeout para obtener conexión

  // Keep-alive (evita conexiones muertas)
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
// WARM-UP: Abrir 5 conexiones al inicio
// ============================================
async function warmUpPool() {
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
    // Liberar todas las conexiones
    connections.forEach((conn) => {
      try { conn.release(); } catch (e) { /* ignore */ }
    });
  }
}

// ============================================
// LOGS (solo si el pool se satura)
// ============================================
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  pool.on('enqueue', () => {
    const queue = pool.pool?._connectionQueue?.length ?? 0;
    if (queue > 3) {
      console.warn(`[DB] Cola de conexiones: ${queue} peticiones esperando`);
    }
  });

  pool.on('acquire', () => {
    const free = pool.pool?._freeConnections?.length ?? 0;
    const total = pool.pool?._allConnections?.length ?? 0;
    // Solo loguear si el pool está saturado
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
// ============================================
pool
  .query('SELECT 1')
  .then(() => {
    console.log('[DB] Pool conectado correctamente');
    return warmUpPool();
  })
  .catch((err) => console.error('[DB] Error conectando al pool:', err.message));