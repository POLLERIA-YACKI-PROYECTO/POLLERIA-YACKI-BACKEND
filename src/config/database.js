// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'polleria_yacky',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exportar el pool para query directa
module.exports = pool;

// Método para obtener conexión para transacciones
pool.getConnection = async function() {
  return await pool.getConnection();
};