// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rutas de login
router.post('/login', authController.login);
router.post('/login-admin', authController.loginAdmin);
router.post('/login-mesero', authController.loginMesero);

module.exports = router;