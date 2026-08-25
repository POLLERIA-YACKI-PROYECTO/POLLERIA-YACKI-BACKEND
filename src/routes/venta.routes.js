const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');

router.get('/', ventaController.getAll);
router.get('/:id', ventaController.getById);
router.get('/fecha', ventaController.getByFecha);
router.get('/resumen/diario', ventaController.getResumenDiario);
router.post('/', ventaController.create);
router.delete('/:id', ventaController.delete);

module.exports = router;