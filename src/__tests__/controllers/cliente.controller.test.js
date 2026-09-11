// src/__tests__/controllers/cliente.controller.test.js
const request = require('supertest');

// ✅ Los mocks de multer y default-image están en jest.setup.js
jest.mock('../../models/Cliente');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'mesero';
    next();
  }
}));

const app = require('../../app');
const Cliente = require('../../models/Cliente');

describe('Cliente Controller', () => {
  const mockCliente = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    dni: '12345678',
    telefono: '987654321',
    email: 'juan@test.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/clientes', () => {
    it('debe retornar todos los clientes', async () => {
      Cliente.findAll.mockResolvedValue([mockCliente]);

      const response = await request(app).get('/api/clientes');

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // BUSCAR
  // ============================================
  describe('GET /api/clientes/buscar', () => {
    it('debe buscar clientes por término', async () => {
      Cliente.buscar.mockResolvedValue([mockCliente]);

      const response = await request(app)
        .get('/api/clientes/buscar')
        .query({ q: 'Juan' });

      expect(response.status).toBe(200);
    });

    it('debe retornar array vacío si término muy corto', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar')
        .query({ q: 'J' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/clientes/:id', () => {
    it('debe retornar cliente por ID', async () => {
      Cliente.findById.mockResolvedValue(mockCliente);

      const response = await request(app).get('/api/clientes/1');

      expect(response.status).toBe(200);
    });

    it('debe retornar 404 si no existe', async () => {
      Cliente.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/clientes/999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/clientes', () => {
    it('debe crear un cliente correctamente', async () => {
      Cliente.findByDni.mockResolvedValue(null);
      Cliente.create.mockResolvedValue({ id: 1, ...mockCliente });

      const response = await request(app)
        .post('/api/clientes')
        .send({
          nombre: 'Juan',
          apellido: 'Perez',
          dni: '12345678',
          telefono: '987654321'
        });

      expect(response.status).toBe(201);
    });

    it('debe retornar 400 si falta el nombre', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .send({ dni: '12345678' });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si DNI inválido', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .send({ nombre: 'Juan', dni: '123' });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si DNI ya existe', async () => {
      Cliente.findByDni.mockResolvedValue(mockCliente);

      const response = await request(app)
        .post('/api/clientes')
        .send({ nombre: 'Otro', dni: '12345678' });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // UPDATE
  // ============================================
  describe('PUT /api/clientes/:id', () => {
    it('debe actualizar un cliente', async () => {
      Cliente.findById
        .mockResolvedValueOnce(mockCliente)
        .mockResolvedValueOnce({ ...mockCliente, nombre: 'Actualizado' });
      Cliente.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/clientes/1')
        .send({ nombre: 'Actualizado' });

      expect(response.status).toBe(200);
    });

    it('debe retornar 404 si no existe', async () => {
      Cliente.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/clientes/999')
        .send({ nombre: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/clientes/:id', () => {
    it('debe eliminar un cliente', async () => {
      Cliente.findById.mockResolvedValue(mockCliente);
      Cliente.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/clientes/1');

      expect(response.status).toBe(200);
    });

    it('debe retornar 404 si no existe', async () => {
      Cliente.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/clientes/999');

      expect(response.status).toBe(404);
    });
  });
});