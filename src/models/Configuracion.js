const db = require('../config/database');

class Configuracion {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM configuracion');
    const config = {};
    rows.forEach(row => {
      config[row.clave] = row.valor;
    });
    return config;
  }

  static async update(clave, valor) {
    const [result] = await db.query(
      'UPDATE configuracion SET valor = ? WHERE clave = ?',
      [valor, clave]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Configuracion;