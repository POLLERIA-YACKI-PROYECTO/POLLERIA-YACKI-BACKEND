// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// ============================================
// LOGIN GENERAL (personal - por DNI)
// ============================================
router.post('/login', authController.login);

// ============================================
// LOGIN ADMIN / CAJERO
// ============================================
router.post('/login-admin', authController.loginAdmin);

// ============================================
// LOGIN MESERO
// ============================================
router.post('/login-mesero', authController.loginMesero);

// ============================================
// LOGIN CLIENTE (email + password)
// ============================================
router.post('/cliente/login', authController.loginCliente);

// ============================================
// REGISTRO CLIENTE (envia codigo por correo)
// ============================================
router.post('/cliente/register', authController.registerCliente);

// ============================================
// VERIFICAR CODIGO DE CORREO
// ============================================
router.post('/cliente/verificar-codigo', authController.verificarCodigoCliente);

// ============================================
// REENVIAR CODIGO
// ============================================
router.post('/cliente/reenviar-codigo', authController.reenviarCodigo);

module.exports = router;