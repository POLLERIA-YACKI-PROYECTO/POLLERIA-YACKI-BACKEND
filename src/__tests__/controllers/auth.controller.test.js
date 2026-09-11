// src/__tests__/controllers/auth.controller.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');

// ✅ IMPORTANTE: Mockear el modelo ANTES de importar el controlador
jest.mock('../../models/Usuario');

const app = require('../../app');
const Usuario = require('../../models/Usuario');

describe('Auth Controller', () => {
  // Datos de prueba
  const mockAdmin = {
    id: 1,
    nombre: 'Admin',
    apellido: 'Sistema',
    dni: '12345678',
    rol: 'admin',
    activo: 1,
    password: 'hashed_password'
  };

  const mockMesero = {
    id: 3,
    nombre: 'Mesero',
    apellido: 'Sistema',
    dni: '11111111',
    rol: 'mesero',
    activo: 1,
    password: 'hashed_password'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // LOGIN ADMIN
  // ============================================
  describe('POST /api/auth/login-admin', () => {
    it('debe retornar token y datos del admin con DNI válido', async () => {
      // Arrange
      Usuario.findByDni.mockResolvedValue({ ...mockAdmin });

      // Act
      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '12345678' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.rol).toBe('admin');
      expect(response.body.password).toBeUndefined(); // No debe incluir password
      expect(Usuario.findByDni).toHaveBeenCalledWith('12345678');
    });

    it('debe retornar 400 si el DNI no tiene 8 dígitos', async () => {
      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('DNI inválido');
      expect(Usuario.findByDni).not.toHaveBeenCalled();
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      Usuario.findByDni.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '99999999' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    it('debe retornar 403 si el usuario no es admin ni cajero', async () => {
      Usuario.findByDni.mockResolvedValue({ ...mockMesero, rol: 'mesero' });

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '11111111' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Acceso denegado');
    });

    it('debe retornar 500 si hay error en la base de datos', async () => {
      Usuario.findByDni.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '12345678' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error al iniciar sesión');
    });
  });

  // ============================================
  // LOGIN MESERO
  // ============================================
  describe('POST /api/auth/login-mesero', () => {
    it('debe retornar token para mesero válido', async () => {
      Usuario.findByDni.mockResolvedValue({ ...mockMesero });

      const response = await request(app)
        .post('/api/auth/login-mesero')
        .send({ dni: '11111111' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.rol).toBe('mesero');
    });

    it('debe retornar 403 si el usuario no es mesero', async () => {
      Usuario.findByDni.mockResolvedValue({ ...mockAdmin });

      const response = await request(app)
        .post('/api/auth/login-mesero')
        .send({ dni: '12345678' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Se requiere rol de mesero');
    });
  });
});