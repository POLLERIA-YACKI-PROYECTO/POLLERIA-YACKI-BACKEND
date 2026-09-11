// src/__tests__/controllers/venta.controller.test.js
const request = require('supertest');

// ✅ Los mocks de multer y default-image están en jest.setup.js
jest.mock('../../models/Venta');
jest.mock('../../config/database');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  }
}));

const app = require('../../app');
const Venta = require('../../models/Venta');
const db = require('../../config/database');

describe('Venta Controller', () => {
  const mockVenta = {
    id: 1,
    pedido_id: 1,
    usuario_id: 3,
    cliente_nombre: 'Juan Perez',
    items: [{ nombre: '1/4 pollo', cantidad: 2, precio: 12 }],
    subtotal: 24,
    igv: 4.32,
    total: 28.32,
    metodo_pago: 'efectivo',
    tipo_entrega: 'local',
    estado: 'completada'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/ventas', () => {
    it('debe retornar todas las ventas', async () => {
      Venta.findAll.mockResolvedValue([mockVenta]);

      const response = await request(app).get('/api/ventas');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('debe parsear items de string a JSON', async () => {
      Venta.findAll.mockResolvedValue([{
        ...mockVenta,
        items: JSON.stringify(mockVenta.items)
      }]);

      const response = await request(app).get('/api/ventas');

      expect(Array.isArray(response.body[0].items)).toBe(true);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/ventas/:id', () => {
    it('debe retornar una venta por ID', async () => {
      Venta.findById.mockResolvedValue(mockVenta);

      const response = await request(app).get('/api/ventas/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('debe retornar 404 si no existe', async () => {
      Venta.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/ventas/999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // GET BY USUARIO
  // ============================================
  describe('GET /api/ventas/usuario/:usuarioId', () => {
    it('debe retornar ventas por usuario', async () => {
      Venta.findByUsuario.mockResolvedValue([mockVenta]);

      const response = await request(app).get('/api/ventas/usuario/3');

      expect(response.status).toBe(200);
      expect(Venta.findByUsuario).toHaveBeenCalledWith('3');
    });
  });

  // ============================================
  // GET BY TIPO
  // ============================================
  describe('GET /api/ventas/tipo/:tipo', () => {
    it('debe retornar ventas por tipo de entrega', async () => {
      Venta.findByTipoEntrega.mockResolvedValue([mockVenta]);

      const response = await request(app).get('/api/ventas/tipo/local');

      expect(response.status).toBe(200);
      expect(Venta.findByTipoEntrega).toHaveBeenCalledWith('local');
    });
  });

  // ============================================
  // RESUMEN POR USUARIO
  // ============================================
  describe('GET /api/ventas/resumen/usuario/:usuarioId', () => {
    it('debe retornar resumen por usuario', async () => {
      db.query.mockResolvedValue([[
        {
          total_ventas: 10,
          total_recaudado: 500.00,
          total_local: 300.00,
          total_delivery: 200.00,
          total_efectivo: 250.00,
          total_tarjeta: 100.00,
          total_yape: 100.00,
          total_plin: 50.00
        }
      ]]);

      const response = await request(app)
        .get('/api/ventas/resumen/usuario/3');

      expect(response.status).toBe(200);
      expect(response.body.total_ventas).toBe(10);
    });

    it('debe retornar ceros si no hay datos', async () => {
      db.query.mockResolvedValue([[{}]]);

      const response = await request(app)
        .get('/api/ventas/resumen/usuario/999');

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // RESUMEN GENERAL
  // ============================================
  describe('GET /api/ventas/resumen/general', () => {
    it('debe retornar resumen general', async () => {
      db.query.mockResolvedValue([[
        {
          total_ventas: 100,
          total_recaudado: 5000.00,
          total_local: 3000.00,
          total_delivery: 2000.00
        }
      ]]);

      const response = await request(app)
        .get('/api/ventas/resumen/general');

      expect(response.status).toBe(200);
      expect(response.body.total_ventas).toBe(100);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/ventas/:id', () => {
    it('debe eliminar una venta', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/ventas/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Venta eliminada correctamente');
    });

    it('debe retornar 404 si no existe', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const response = await request(app).delete('/api/ventas/999');

      expect(response.status).toBe(404);
    });
  });
});