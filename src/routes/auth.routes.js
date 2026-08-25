const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login general
router.post('/login', authController.login);

// Login específico para admin
router.post('/login-admin', authController.loginAdmin);

// Login específico para mesero
router.post('/login-mesero', authController.loginMesero);

module.exports = router;