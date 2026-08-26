const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'polleria_yacky',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
  try {
    const [rows] = await promisePool.query('SELECT 1');
    console.log(' Conexión a MySQL exitosa');
    return true;
  } catch (error) {
    console.error(' Error de conexión a MySQL:', error.message);
    console.log(' Verifica que:');
    console.log('   1. MySQL esté corriendo');
    console.log('   2. Las credenciales sean correctas');
    console.log('   3. La base de datos "polleria_yacky" exista');
    return false;
  }
};

module.exports = promisePool;
module.exports.testConnection = testConnection;