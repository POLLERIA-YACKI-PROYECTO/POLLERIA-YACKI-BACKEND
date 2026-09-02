// src/routes/configuracion.routes.js

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracion.controller');

router.get('/', configController.getAll);
router.put('/:clave', configController.update);

module.exports = router;