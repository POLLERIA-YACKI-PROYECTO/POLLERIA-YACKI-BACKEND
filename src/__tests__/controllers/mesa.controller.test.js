// src/__tests__/controllers/mesa.controller.test.js
const request = require('supertest');

// ✅ Los mocks de multer y default-image están en jest.setup.js
jest.mock('../../models/Mesa');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'mesero';
    next();
  }
}));

const app = require('../../app');
const Mesa = require('../../models/Mesa');

describe('Mesa Controller', () => {
  const mockMesa = {
    id: 1,
    numero: 1,
    capacidad: 4,
    ubicacion: 'Sala Principal',
    ocupada: false,
    cliente: null,
    cantidad_personas: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/mesas', () => {
    it('debe retornar todas las mesas', async () => {
      Mesa.findAll.mockResolvedValue([mockMesa]);

      const response = await request(app).get('/api/mesas');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/mesas/:id', () => {
    it('debe retornar mesa por ID', async () => {
      Mesa.findById.mockResolvedValue(mockMesa);

      const response = await request(app).get('/api/mesas/1');

      expect(response.status).toBe(200);
    });

    it('debe retornar 404 si no existe', async () => {
      Mesa.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/mesas/999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/mesas', () => {
    it('debe crear una mesa correctamente', async () => {
      Mesa.findByNumero.mockResolvedValue(null);
      Mesa.create.mockResolvedValue({ id: 11, numero: 11, capacidad: 4 });

      const response = await request(app)
        .post('/api/mesas')
        .send({ numero: 11, capacidad: 4 });

      expect(response.status).toBe(201);
    });

    it('debe retornar 400 si falta número', async () => {
      const response = await request(app)
        .post('/api/mesas')
        .send({ capacidad: 4 });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si ya existe el número', async () => {
      Mesa.findByNumero.mockResolvedValue(mockMesa);

      const response = await request(app)
        .post('/api/mesas')
        .send({ numero: 1 });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // OCUPAR MESA
  // ============================================
  describe('PUT /api/mesas/ocupar/:numero', () => {
    it('debe ocupar una mesa correctamente', async () => {
      Mesa.findByNumero
        .mockResolvedValueOnce({ ...mockMesa, ocupada: false })
        .mockResolvedValueOnce({ ...mockMesa, ocupada: true, cliente: 'Juan' });
      Mesa.ocuparMesa.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/mesas/ocupar/1')
        .send({ cliente: 'Juan', cantidad_personas: 4 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 400 si falta cliente', async () => {
      const response = await request(app)
        .put('/api/mesas/ocupar/1')
        .send({});

      expect(response.status).toBe(400);
    });

    it('debe retornar 404 si la mesa no existe', async () => {
      Mesa.findByNumero.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/mesas/ocupar/999')
        .send({ cliente: 'Juan' });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // LIBERAR MESA
  // ============================================
  describe('PUT /api/mesas/liberar/:numero', () => {
    it('debe liberar una mesa correctamente', async () => {
      Mesa.findByNumero
        .mockResolvedValueOnce({ ...mockMesa, ocupada: true, cliente: 'Juan' })
        .mockResolvedValueOnce({ ...mockMesa, ocupada: false, cliente: null });
      Mesa.liberarMesa.mockResolvedValue(true);

      const response = await request(app).put('/api/mesas/liberar/1');

      expect(response.status).toBe(200);
    });

    it('debe retornar 400 si la mesa ya está libre', async () => {
      Mesa.findByNumero.mockResolvedValue({ ...mockMesa, ocupada: false });

      const response = await request(app).put('/api/mesas/liberar/1');

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/mesas/:id', () => {
    it('debe eliminar una mesa', async () => {
      Mesa.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/mesas/1');

      expect(response.status).toBe(200);
    });

    it('debe retornar 404 si no existe', async () => {
      Mesa.delete.mockResolvedValue(false);

      const response = await request(app).delete('/api/mesas/999');

      expect(response.status).toBe(404);
    });
  });
});