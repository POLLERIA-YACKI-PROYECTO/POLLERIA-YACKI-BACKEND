// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/productos', require('./src/routes/producto.routes'));
app.use('/api/categorias', require('./src/routes/categoria.routes'));
app.use('/api/ventas', require('./src/routes/venta.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));
app.use('/api/clientes', require('./src/routes/cliente.routes'));
app.use('/api/pedidos', require('./src/routes/pedido.routes'));
app.use('/api/reportes', require('./src/routes/reporte.routes'));
app.use('/api/mesas', require('./src/routes/mesa.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Rutas registradas:`);
  console.log(`  - /api/auth`);
  console.log(`  - /api/productos`);
  console.log(`  - /api/categorias`);
  console.log(`  - /api/ventas`);
  console.log(`  - /api/usuarios`);
  console.log(`  - /api/clientes`);
  console.log(`  - /api/pedidos`);
  console.log(`  - /api/reportes`);
  console.log(`  - /api/mesas ✅ NUEVA`);
});