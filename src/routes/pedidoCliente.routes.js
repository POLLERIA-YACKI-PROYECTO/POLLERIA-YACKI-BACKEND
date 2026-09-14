// src/routes/pedidoCliente.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pedidoClienteController = require('../controllers/PedidoCliente.Controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/comprobantes');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `comprobante-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Solo se permiten imágenes o PDF'));
  }
});

// ============================================
// RUTAS ESPECÍFICAS
// ============================================
router.get('/pendientes', verifyToken, pedidoClienteController.getPendientes);
router.get('/cliente/:clienteId', verifyToken, pedidoClienteController.getByCliente);

// ============================================
// RUTAS GENERALES
// ============================================
router.get('/', verifyToken, pedidoClienteController.getAll);
router.get('/:id', verifyToken, pedidoClienteController.getById);
router.post('/', verifyToken, pedidoClienteController.create);

// ============================================
// ✅ SUBIR COMPROBANTE
// ============================================
router.post(
  '/:id/comprobante',
  verifyToken,
  upload.single('comprobante'),
  pedidoClienteController.subirComprobante
);

// ============================================
// ✅ CONFIRMAR PAGO (SOLO ADMIN)
// ============================================
router.put(
  '/:id/confirmar-pago',
  verifyToken,
  isAdmin,
  pedidoClienteController.confirmarPago
);

// ============================================
// ✅ RECHAZAR PAGO (SOLO ADMIN)
// ============================================
router.put(
  '/:id/rechazar-pago',
  verifyToken,
  isAdmin,
  pedidoClienteController.rechazarPago
);

// ============================================
// OTRAS RUTAS
// ============================================
router.put('/:id/estado', verifyToken, pedidoClienteController.updateEstado);
router.delete('/:id', verifyToken, isAdmin, pedidoClienteController.delete);

module.exports = router;