const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-yacky-secret-key';

// Login general - verifica rol y redirige según el frontend
exports.login = async (req, res) => {
  try {
    const { dni, rol } = req.body;

    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    // Buscar usuario por DNI
    const [users] = await db.query('SELECT * FROM usuarios WHERE dni = ? AND activo = true', [dni]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = users[0];
    
    // Verificar que el rol coincida con el solicitado
    if (rol && usuario.rol !== rol) {
      return res.status(403).json({ 
        error: `Acceso denegado. Esta cuenta es de tipo ${usuario.rol}, no ${rol}` 
      });
    }

    // Si no tiene password (usuario de prueba), generamos uno temporal
    if (!usuario.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, usuario.id]);
      usuario.password = hashedPassword;
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Actualizar último acceso
    await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

    delete usuario.password;

    res.json({
      ...usuario,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Login específico para admin
exports.loginAdmin = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE dni = ? AND rol IN ("admin", "cajero") AND activo = true', 
      [dni]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario administrador no encontrado' });
    }

    const usuario = users[0];
    
    if (!usuario.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, usuario.id]);
      usuario.password = hashedPassword;
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

    delete usuario.password;

    res.json({
      ...usuario,
      token
    });
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Login específico para mesero
exports.loginMesero = async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni || dni.length !== 8) {
      return res.status(400).json({ error: 'DNI inválido' });
    }

    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE dni = ? AND rol = "mesero" AND activo = true', 
      [dni]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario mesero no encontrado' });
    }

    const usuario = users[0];
    
    if (!usuario.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, usuario.id]);
      usuario.password = hashedPassword;
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

    delete usuario.password;

    res.json({
      ...usuario,
      token
    });
  } catch (error) {
    console.error('Error en loginMesero:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};