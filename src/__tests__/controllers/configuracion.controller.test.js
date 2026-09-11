// src/__tests__/controllers/configuracion.controller.test.js
const request = require('supertest');

jest.mock('../../models/Configuracion');
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
  });

  describe('GET /api/configuracion', () => {
    it('debe retornar toda la configuración', async () => {
      Configuracion.findAll.mockResolvedValue([mockConfig]);

      const response = await request(app).get('/api/configuracion');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/configuracion/:clave', () => {
    it('debe retornar configuración por clave', async () => {
      Configuracion.findByClave.mockResolvedValue(mockConfig);

      const response = await request(app).get('/api/configuracion/EMPRESA_NOMBRE');

      expect(response.status).toBe(200);
      expect(response.body.data.clave).toBe('EMPRESA_NOMBRE');
    });

    it('debe retornar 404 si no existe', async () => {
      Configuracion.findByClave.mockResolvedValue(null);

      const response = await request(app).get('/api/configuracion/NO_EXISTE');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/configuracion/:clave', () => {
    it('debe actualizar configuración correctamente', async () => {
      Configuracion.findByClave
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce({ ...mockConfig, valor: 'Nuevo Valor' });
      
      Configuracion.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/configuracion/EMPRESA_NOMBRE')
        .send({ valor: 'Nuevo Valor' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 400 si falta el valor', async () => {
      const response = await request(app)
        .put('/api/configuracion/EMPRESA_NOMBRE')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El valor es requerido');
    });
  });
});