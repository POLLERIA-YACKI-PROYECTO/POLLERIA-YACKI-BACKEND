const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesa.controller');

router.get('/', mesaController.getAll);
router.get('/:id', mesaController.getById);
router.post('/', mesaController.create);
router.put('/ocupar/:numero', mesaController.ocuparMesa);
router.put('/liberar/:numero', mesaController.liberarMesa);
router.delete('/:id', mesaController.delete);

module.exports = router;