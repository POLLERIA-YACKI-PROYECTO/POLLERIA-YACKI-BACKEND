// src/__tests__/controllers/auth.controller.test.js
const request = require('supertest');

// ⚠️ Los mocks de modelos están en jest.setup.js (global).
// NO los pongas aquí.

const app = require('../../app');
const Usuario = require('../../models/Usuario');

describe('Auth Controller', () => {
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

  describe('POST /api/auth/login-admin', () => {
    it('debe retornar token y datos del admin con DNI válido', async () => {
      Usuario.findByDni.mockResolvedValue({ ...mockAdmin });

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '12345678' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.rol).toBe('admin');
      expect(response.body.password).toBeUndefined();
      expect(Usuario.findByDni).toHaveBeenCalledWith('12345678');
    });

    it('debe retornar 400 si el DNI no tiene 8 dígitos', async () => {
      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/DNI/i);
      expect(Usuario.findByDni).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si el usuario no existe', async () => {
      Usuario.findByDni.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '99999999' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/DNI/i);
    });

    it('debe retornar 403 si el usuario no es admin ni cajero', async () => {
      Usuario.findByDni.mockResolvedValue({ ...mockMesero, rol: 'mesero' });

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '11111111' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Acceso denegado/i);
    });

    it('debe retornar 500 si hay error en la base de datos', async () => {
      Usuario.findByDni.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/auth/login-admin')
        .send({ dni: '12345678' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Error al iniciar sesi/i);
    });
  });

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
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Se requiere rol de mesero/i);
    });
  });
});