// src/__tests__/controllers/configuracion.controller.test.js
const request = require('supertest');

// ⚠️ NO mockear modelos aquí: ya están en jest.setup.js

jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  },
  isAdmin: (req, res, next) => next()
}));

const app = require('../../app');
const Configuracion = require('../../models/Configuracion');
const db = require('../../config/database');

describe('Configuracion Controller', () => {
  const mockConfig = {
    id: 1,
    clave: 'EMPRESA_NOMBRE',
    valor: 'Doña Yacki',
    tipo: 'texto',
    descripcion: 'Nombre de la empresa'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockResolvedValue([[], []]);
  });

  describe('GET /api/configuracion', () => {
    it('debe retornar toda la configuración', async () => {
      Configuracion.findAll.mockResolvedValue([mockConfig]);

      const response = await request(app).get('/api/configuracion');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.EMPRESA_NOMBRE).toBe('Doña Yacki');
      expect(response.body.raw).toHaveLength(1);
    });

    it('debe retornar config vacío si no hay datos', async () => {
      Configuracion.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/configuracion');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config).toEqual({});
      expect(response.body.raw).toEqual([]);
    });
  });

  describe('GET /api/configuracion/:clave', () => {
    it('debe retornar configuración por clave', async () => {
      Configuracion.findByClave.mockResolvedValue(mockConfig);

      const response = await request(app).get('/api/configuracion/EMPRESA_NOMBRE');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clave).toBe('EMPRESA_NOMBRE');
      expect(response.body.data.valor).toBe('Doña Yacki');
    });

    it('debe retornar 404 si no existe', async () => {
      Configuracion.findByClave.mockResolvedValue(null);

      const response = await request(app).get('/api/configuracion/NO_EXISTE');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/configuracion/:clave', () => {
    it('debe actualizar configuración correctamente (batch)', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }, []]);

      const response = await request(app)
        .put('/api/configuracion/EMPRESA_NOMBRE')
        .send({ EMPRESA_NOMBRE: 'Nuevo Valor' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(db.query).toHaveBeenCalled();
    });

    it('debe retornar 400 si no hay claves válidas', async () => {
      const response = await request(app)
        .put('/api/configuracion/EMPRESA_NOMBRE')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No hay claves válidas para actualizar');
    });

    it('debe retornar 400 si la clave enviada no está permitida', async () => {
      const response = await request(app)
        .put('/api/configuracion/EMPRESA_NOMBRE')
        .send({ CLAVE_INVENTADA: 'x' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No hay claves válidas para actualizar');
    });
  });
});