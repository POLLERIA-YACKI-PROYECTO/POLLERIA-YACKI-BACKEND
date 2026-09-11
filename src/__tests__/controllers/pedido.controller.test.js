// src/__tests__/controllers/pedido.controller.test.js
const request = require('supertest');

// ✅ Los mocks de multer y default-image están en jest.setup.js
jest.mock('../../models/Pedido');
jest.mock('../../config/database');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 3;
    req.userRol = 'mesero';
    next();
  }
}));

const app = require('../../app');
const Pedido = require('../../models/Pedido');
const db = require('../../config/database');

describe('Pedido Controller', () => {
  const mockPedido = {
    id: 1,
    usuario_id: 3,
    usuario_nombre: 'Mesero',
    usuario_apellido: 'Sistema',
    cliente_nombre: 'Juan Perez',
    items: [
      { id: 1, nombre: '1/4 pollo', precio: 12, cantidad: 2, subtotal: 24 }
    ],
    subtotal: 24,
    igv: 4.32,
    total: 28.32,
    tipo_entrega: 'local',
    estado: 'pendiente',
    pagado: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/pedidos', () => {
    it('debe retornar pedidos del usuario autenticado', async () => {
      Pedido.findByUsuario.mockResolvedValue([mockPedido]);

      const response = await request(app).get('/api/pedidos');

      expect(response.status).toBe(200);
      expect(Pedido.findByUsuario).toHaveBeenCalledWith(3);
    });

    it('debe retornar 500 si hay error', async () => {
      Pedido.findByUsuario.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/pedidos');

      expect(response.status).toBe(500);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/pedidos/:id', () => {
    it('debe retornar un pedido por ID', async () => {
      Pedido.findById.mockResolvedValue(mockPedido);

      const response = await request(app).get('/api/pedidos/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('debe retornar 404 si no existe', async () => {
      Pedido.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/pedidos/999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/pedidos', () => {
    const nuevoPedido = {
      cliente_nombre: 'Cliente Test',
      items: [
        { id: 1, nombre: '1/4 pollo', precio: 12, cantidad: 2, subtotal: 24 }
      ],
      tipo_entrega: 'local',
      total: 28.32
    };

    it('debe crear un pedido correctamente', async () => {
      Pedido.create.mockResolvedValue({ id: 1, ...nuevoPedido });
      Pedido.findById.mockResolvedValue({ id: 1, ...mockPedido });

      const response = await request(app)
        .post('/api/pedidos')
        .send(nuevoPedido);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 400 si no hay items', async () => {
      const response = await request(app)
        .post('/api/pedidos')
        .send({ cliente_nombre: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El pedido debe tener al menos un item');
    });
  });

  // ============================================
  // UPDATE ESTADO
  // ============================================
  describe('PUT /api/pedidos/:id/estado', () => {
    it('debe actualizar el estado correctamente', async () => {
      Pedido.updateEstado.mockResolvedValue(true);
      Pedido.findById.mockResolvedValue({ ...mockPedido, estado: 'preparando' });

      const response = await request(app)
        .put('/api/pedidos/1/estado')
        .send({ estado: 'preparando' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 400 con estado inválido', async () => {
      const response = await request(app)
        .put('/api/pedidos/1/estado')
        .send({ estado: 'invalido' });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // MARCAR PAGADO
  // ============================================
  describe('PATCH /api/pedidos/:id/pagar', () => {
    it('debe marcar pedido como pagado', async () => {
      db.query
        .mockResolvedValueOnce([[{ ...mockPedido, pagado: 0 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ ...mockPedido, pagado: 1 }]])
        .mockResolvedValueOnce([[]]);

      const response = await request(app)
        .patch('/api/pedidos/1/pagar')
        .send({ metodo_pago: 'efectivo' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 400 si falta metodo_pago', async () => {
      const response = await request(app)
        .patch('/api/pedidos/1/pagar')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // GET PENDIENTES
  // ============================================
  describe('GET /api/pedidos/pendientes', () => {
    it('debe retornar pedidos pendientes', async () => {
      Pedido.findPendientes.mockResolvedValue([{ ...mockPedido, estado: 'pendiente' }]);

      const response = await request(app).get('/api/pedidos/pendientes');

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // GET PAGADOS
  // ============================================
  describe('GET /api/pedidos/pagados', () => {
    it('debe retornar pedidos pagados', async () => {
      Pedido.findPagados.mockResolvedValue([{ ...mockPedido, pagado: 1 }]);

      const response = await request(app).get('/api/pedidos/pagados');

      expect(response.status).toBe(200);
    });
  });

  // ============================================
  // GET ENTREGADOS DEL MESERO
  // ============================================
  describe('GET /api/pedidos/entregados/mesero', () => {
    it('debe retornar pedidos entregados del mesero', async () => {
      Pedido.findEntregadosByUsuario.mockResolvedValue([{ ...mockPedido, estado: 'entregado' }]);

      const response = await request(app).get('/api/pedidos/entregados/mesero');

      expect(response.status).toBe(200);
      expect(Pedido.findEntregadosByUsuario).toHaveBeenCalledWith(3);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/pedidos/:id', () => {
    it('debe eliminar un pedido', async () => {
      Pedido.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/pedidos/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 404 si no existe', async () => {
      Pedido.delete.mockResolvedValue(false);

      const response = await request(app).delete('/api/pedidos/999');

      expect(response.status).toBe(404);
    });
  });
});