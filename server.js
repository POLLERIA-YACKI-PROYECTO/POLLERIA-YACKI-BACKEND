const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/productos', require('./src/routes/producto.routes'));
app.use('/api/categorias', require('./src/routes/categoria.routes'));
app.use('/api/ventas', require('./src/routes/venta.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));

// ✅ AGREGAR RUTAS DE CLIENTES
app.use('/api/clientes', require('./src/routes/cliente.routes'));

// ✅ AGREGAR RUTAS DE PEDIDOS
app.use('/api/pedidos', require('./src/routes/pedido.routes'));

// ✅ AGREGAR RUTAS DE REPORTES
app.use('/api/reportes', require('./src/routes/reporte.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});