// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// ============================================
// LOGIN GENERAL (personal - por DNI)
// ============================================
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión general (personal)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: DNI inválido
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', authController.login);

// ============================================
// LOGIN ADMIN / CAJERO
// ============================================
/**
 * @swagger
 * /auth/login-admin:
 *   post:
 *     summary: Iniciar sesión como administrador o cajero
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       403:
 *         description: Acceso denegado - Se requiere rol admin o cajero
 */
router.post('/login-admin', authController.loginAdmin);

// ============================================
// LOGIN MESERO
// ============================================
/**
 * @swagger
 * /auth/login-mesero:
 *   post:
 *     summary: Iniciar sesión como mesero
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       403:
 *         description: Acceso denegado - Se requiere rol mesero
 */
router.post('/login-mesero', authController.loginMesero);

// ============================================
// LOGIN CLIENTE (email + password)
// ============================================
/**
 * @swagger
 * /auth/cliente/login:
 *   post:
 *     summary: Iniciar sesión como cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginClienteRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginClienteResponse'
 *       401:
 *         description: Credenciales incorrectas
 *       403:
 *         description: Cuenta desactivada
 */
router.post('/cliente/login', authController.loginCliente);

// ============================================
// REGISTRO CLIENTE
// ============================================
/**
 * @swagger
 * /auth/cliente/register:
 *   post:
 *     summary: Registrar nuevo cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterClienteRequest'
 *     responses:
 *       201:
 *         description: Cliente registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginClienteResponse'
 *       409:
 *         description: El correo ya está registrado
 */
router.post('/cliente/register', authController.registerCliente);

module.exports = router;