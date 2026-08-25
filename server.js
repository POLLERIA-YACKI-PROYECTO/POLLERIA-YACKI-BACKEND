const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/productos', require('./src/routes/producto.routes'));
app.use('/api/categorias', require('./src/routes/categoria.routes'));
app.use('/api/ventas', require('./src/routes/venta.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});