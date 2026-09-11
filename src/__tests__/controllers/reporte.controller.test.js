// src/__tests__/controllers/reporte.controller.test.js
const request = require('supertest');

jest.mock('../../models/Venta');
jest.mock('../../models/Usuario');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  },
  isAdmin: (req, res, next) => next()
}));

const app = require('../../app');
const Venta = require('../../models/Venta');

describe('Reporte Controller', () => {
  const mockVentas = [
    {
      id: 1,
      usuario_id: 3,
      usuario_nombre: 'Mesero',
      usuario_rol: 'mesero',
      total: 28.32,
      metodo_pago: 'efectivo',
      tipo_entrega: 'local',
      items: [{ nombre: '1/4 pollo', cantidad: 2 }],
      fecha_venta: '2026-09-11'
    },
    {
      id: 2,
      usuario_id: 3,
      usuario_nombre: 'Mesero',
      usuario_rol: 'mesero',
      total: 45.00,
      metodo_pago: 'yape',
      tipo_entrega: 'delivery',
      items: [{ nombre: '1 pollo', cantidad: 1 }],
      fecha_venta: '2026-09-11'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // REPORTE DE VENTAS
  // ============================================
  describe('GET /api/reportes/ventas', () => {
    it('debe generar reporte de ventas', async () => {
      Venta.findByFecha.mockResolvedValue(mockVentas);

      const response = await request(app)
        .get('/api/reportes/ventas')
        .query({ fechaInicio: '2026-09-01', fechaFin: '2026-09-30' });

      expect(response.status).toBe(200);
      expect(response.body.resumen.totalVentas).toBe(2);
      expect(response.body.resumen.totalRecaudado).toBe(73.32);
      expect(response.body).toHaveProperty('porMetodoPago');
      expect(response.body).toHaveProperty('porUsuario');
      expect(response.body).toHaveProperty('topProductos');
    });

    it('debe retornar 400 si faltan fechas', async () => {
      const response = await request(app)
        .get('/api/reportes/ventas')
        .query({ fechaInicio: '2026-09-01' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Fecha inicio y fin son requeridas');
    });

    it('debe retornar estructura vacía si no hay ventas', async () => {
      Venta.findByFecha.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/reportes/ventas')
        .query({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.resumen.totalVentas).toBe(0);
      expect(response.body.detalle).toEqual([]);
    });

    it('debe calcular top productos correctamente', async () => {
      Venta.findByFecha.mockResolvedValue(mockVentas);

      const response = await request(app)
        .get('/api/reportes/ventas')
        .query({ fechaInicio: '2026-09-01', fechaFin: '2026-09-30' });

      expect(response.body.topProductos).toBeDefined();
      expect(response.body.topProductos.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // REPORTE DIARIO CAJERO
  // ============================================
  describe('GET /api/reportes/diario-cajero', () => {
    it('debe generar reporte diario', async () => {
      Venta.getResumenDiario.mockResolvedValue({
        total_ventas: 2,
        total_recaudado: 73.32,
        promedio: 36.66,
        total_efectivo: 28.32,
        total_tarjeta: 0,
        total_yape: 45.00,
        total_plin: 0
      });
      Venta.findByFecha.mockResolvedValue(mockVentas);

      const response = await request(app)
        .get('/api/reportes/diario-cajero')
        .query({ fecha: '2026-09-11' });

      expect(response.status).toBe(200);
      expect(response.body.resumen.totalVentas).toBe(2);
      expect(response.body.resumen.porMetodoPago).toBeDefined();
    });

    it('debe retornar 400 si falta fecha', async () => {
      const response = await request(app)
        .get('/api/reportes/diario-cajero');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Fecha es requerida');
    });
  });

  // ============================================
  // REPORTE POR CLIENTE
  // ============================================
 
// src/__tests__/controllers/reporte.controller.test.js
// ... (código anterior)

  // ============================================
  // REPORTE POR CLIENTE
  // ============================================
  describe('GET /api/reportes/por-cliente', () => {
    it('debe generar reporte por cliente', async () => {
      Venta.getVentasPorCliente.mockResolvedValue([
        { cliente_nombre: 'Juan', total_gastado: 50, total_ventas: 2 }
      ]);

      const response = await request(app)
        .get('/api/reportes/por-cliente')  // ✅ Funciona gracias al alias
        .query({ fechaInicio: '2026-09-01', fechaFin: '2026-09-30' });

      expect(response.status).toBe(200);
      expect(response.body.clientes).toHaveLength(1);
    });

    it('debe retornar 400 si faltan fechas', async () => {
      const response = await request(app)
        .get('/api/reportes/por-cliente');

      expect(response.status).toBe(400);
    });
  });

// ... (resto del código)

  // ============================================
  // REPORTE MOTORIZADA
  // ============================================
  describe('GET /api/reportes/motorizada', () => {
    it('debe generar reporte de ventas motorizadas', async () => {
      Venta.findByFecha.mockResolvedValue(mockVentas);

      const response = await request(app)
        .get('/api/reportes/motorizada')
        .query({ fechaInicio: '2026-09-01', fechaFin: '2026-09-30' });

      expect(response.status).toBe(200);
      expect(response.body.totalMotorizadas).toBe(1);
      expect(response.body.totalRecaudado).toBe(45.00);
    });

    it('debe retornar 400 si faltan fechas', async () => {
      const response = await request(app)
        .get('/api/reportes/motorizada');

      expect(response.status).toBe(400);
    });
  });
});