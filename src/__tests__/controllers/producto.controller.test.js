// src/__tests__/controllers/producto.controller.test.js
const request = require('supertest');

// ✅ Los mocks de multer y default-image están en jest.setup.js

jest.mock('../../models/Producto');
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  },
  isAdmin: (req, res, next) => next()
}));

const app = require('../../app');
const Producto = require('../../models/Producto');

describe('Producto Controller', () => {
  const mockProducto = {
    id: 1,
    categoria_id: 1,
    nombre: '1/4 de pollo',
    precio: 12.00,
    descripcion: 'Cuarto de pollo',
    stock: 50,
    disponible: 1,
    agotado: 0,
    imagen: 'imagen.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/productos', () => {
    it('debe retornar todos los productos con URL de imagen', async () => {
      Producto.findAll.mockResolvedValue([mockProducto]);

      const response = await request(app).get('/api/productos');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar 500 si hay error', async () => {
      Producto.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/productos');

      expect(response.status).toBe(500);
    });
  });

  // ============================================
  // GET DISPONIBLES
  // ============================================
  describe('GET /api/productos/disponibles', () => {
    it('debe retornar productos disponibles', async () => {
      Producto.findAvailable.mockResolvedValue([mockProducto]);

      const response = await request(app).get('/api/productos/disponibles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  // ============================================
  // GET BY CATEGORIA
  // ============================================
  describe('GET /api/productos/categoria/:categoriaId', () => {
    it('debe retornar productos por categoría', async () => {
      Producto.findByCategoria.mockResolvedValue([mockProducto]);

      const response = await request(app).get('/api/productos/categoria/1');

      expect(response.status).toBe(200);
      expect(Producto.findByCategoria).toHaveBeenCalledWith('1');
    });

    it('debe retornar array vacío si no hay productos', async () => {
      Producto.findByCategoria.mockResolvedValue([]);

      const response = await request(app).get('/api/productos/categoria/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/productos/:id', () => {
    it('debe retornar un producto por ID', async () => {
      Producto.findById.mockResolvedValue(mockProducto);

      const response = await request(app).get('/api/productos/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
    });

    it('debe retornar 404 si no existe', async () => {
      Producto.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/productos/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/productos', () => {
    it('debe crear un producto correctamente', async () => {
      Producto.create.mockResolvedValue({ id: 1, ...mockProducto });

      const response = await request(app)
        .post('/api/productos')
        .send({
          categoria_id: 1,
          nombre: 'Nuevo Producto',
          precio: 15.00,
          descripcion: 'Descripción',
          stock: 10
        });

      expect(response.status).toBe(201);
      expect(Producto.create).toHaveBeenCalled();
    });

    it('debe retornar 400 si falta nombre o precio', async () => {
      const response = await request(app)
        .post('/api/productos')
        .send({ categoria_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nombre y precio son requeridos');
    });

    it('debe usar imagen por defecto si no se sube archivo', async () => {
      Producto.create.mockResolvedValue({ id: 1, imagen: 'imagen.jpg' });

      await request(app)
        .post('/api/productos')
        .send({
          categoria_id: 1,
          nombre: 'Test',
          precio: 10
        });

      expect(Producto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          imagen: 'imagen.jpg'
        })
      );
    });
  });

  // ============================================
  // UPDATE
  // ============================================
  describe('PUT /api/productos/:id', () => {
    it('debe actualizar un producto', async () => {
      Producto.findById.mockResolvedValue(mockProducto);
      Producto.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/productos/1')
        .send({
          nombre: 'Actualizado',
          precio: 20
        });

      expect(response.status).toBe(200);
      expect(Producto.update).toHaveBeenCalled();
    });

    it('debe retornar 404 si no existe', async () => {
      Producto.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/productos/999')
        .send({ nombre: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // UPDATE IMAGE
  // ============================================
 // ============================================
  describe('PATCH /api/productos/:id/restore-image', () => {
    it('debe restaurar imagen por defecto', async () => {
      Producto.findById.mockResolvedValue({ ...mockProducto, imagen: 'custom.jpg' });
      Producto.updateImage.mockResolvedValue(true);

      const response = await request(app)
        .patch('/api/productos/1/restore-image');  // ✅ Ruta correcta

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 404 si no existe', async () => {
      Producto.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/productos/999/restore-image');  // ✅ Ruta correcta

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // RESTORE DEFAULT IMAGE
  // ============================================
  describe('POST /api/productos/:id/restaurar-imagen', () => {
    it('debe restaurar imagen por defecto', async () => {
      Producto.findById.mockResolvedValue({ ...mockProducto, imagen: 'custom.jpg' });
      Producto.updateImage.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/productos/1/restaurar-imagen');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar 404 si no existe', async () => {
      Producto.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/productos/999/restaurar-imagen');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/productos/:id', () => {
    it('debe eliminar un producto', async () => {
      Producto.findById.mockResolvedValue(mockProducto);
      Producto.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/productos/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Producto eliminado correctamente');
    });

    it('debe retornar 404 si no existe', async () => {
      Producto.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/productos/999');

      expect(response.status).toBe(404);
    });
  });
});