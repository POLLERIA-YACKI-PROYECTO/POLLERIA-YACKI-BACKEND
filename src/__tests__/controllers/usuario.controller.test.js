// src/__tests__/controllers/usuario.controller.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../../models/Usuario');
jest.mock('bcryptjs');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  },
  isAdmin: (req, res, next) => next()
}));

const app = require('../../app');
const Usuario = require('../../models/Usuario');

describe('Usuario Controller', () => {
  const mockUsuario = {
    id: 3,
    nombre: 'Mesero',
    apellido: 'Sistema',
    dni: '11111111',
    rol: 'mesero',
    telefono: '987654321',
    email: 'mesero@test.com',
    activo: 1,
    password: 'hashed_password'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/usuarios', () => {
    it('debe retornar todos los usuarios sin password', async () => {
      Usuario.findAll.mockResolvedValue([mockUsuario]);

      const response = await request(app).get('/api/usuarios');

      expect(response.status).toBe(200);
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[0].nombre).toBe('Mesero');
    });

    it('debe retornar 500 si hay error', async () => {
      Usuario.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/usuarios');

      expect(response.status).toBe(500);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/usuarios/:id', () => {
    it('debe retornar usuario por ID sin password', async () => {
      Usuario.findById.mockResolvedValue(mockUsuario);

      const response = await request(app).get('/api/usuarios/3');

      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
    });

    it('debe retornar 404 si no existe', async () => {
      Usuario.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/usuarios/999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/usuarios', () => {
    it('debe crear un usuario con contraseña hasheada', async () => {
      Usuario.findByDni.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      Usuario.create.mockResolvedValue({ id: 4, nombre: 'Nuevo', dni: '44444444' });

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Nuevo',
          dni: '44444444',
          rol: 'mesero',
          password: '123456'
        });

      expect(response.status).toBe(201);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(Usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_password'
        })
      );
    });

    it('debe retornar 400 si falta nombre o DNI', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({ nombre: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nombre y DNI son requeridos');
    });

    it('debe retornar 400 si el DNI no tiene 8 dígitos', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({ nombre: 'Test', dni: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El DNI debe tener 8 dígitos');
    });

    it('debe retornar 400 si el DNI ya existe', async () => {
      Usuario.findByDni.mockResolvedValue(mockUsuario);

      const response = await request(app)
        .post('/api/usuarios')
        .send({ nombre: 'Test', dni: '11111111' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El DNI ya está registrado');
    });
  });

  // ============================================
  // UPDATE
  // ============================================
  describe('PUT /api/usuarios/:id', () => {
    it('debe actualizar un usuario correctamente', async () => {
      Usuario.findById
        .mockResolvedValueOnce(mockUsuario)
        .mockResolvedValueOnce({ ...mockUsuario, nombre: 'Actualizado' });
      Usuario.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/usuarios/3')
        .send({ nombre: 'Actualizado' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuario actualizado correctamente');
    });

    it('debe retornar 404 si no existe', async () => {
      Usuario.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/usuarios/999')
        .send({ nombre: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/usuarios/:id', () => {
    it('debe eliminar un usuario', async () => {
      Usuario.findById.mockResolvedValue(mockUsuario);
      Usuario.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/usuarios/3');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuario eliminado correctamente');
    });

    it('debe retornar 404 si no existe', async () => {
      Usuario.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/usuarios/999');

      expect(response.status).toBe(404);
    });

    it('NO debe permitir eliminar al admin principal (id: 1)', async () => {
      Usuario.findById.mockResolvedValue({ ...mockUsuario, id: 1 });

      const response = await request(app).delete('/api/usuarios/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No se puede eliminar al administrador principal');
    });
  });
});