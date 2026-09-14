// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'adrian200503',  // ✅ Sin el punto
  database: process.env.DB_NAME || 'polleria_yacki',    // ✅ Con "i" al final
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // ✅ FIX: Manejar JSON de forma segura
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const value = field.string();
      if (value === null || value === undefined) return null;
      try {
        return JSON.parse(value);
      } catch (err) {
        console.error('Error al parsear JSON:', err.message);
        return value; // Devolver el string crudo si falla
      }
    }
    return next();
  }
});

module.exports = pool;