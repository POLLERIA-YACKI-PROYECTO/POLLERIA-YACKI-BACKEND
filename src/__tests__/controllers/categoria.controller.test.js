// src/__tests__/controllers/categoria.controller.test.js
const request = require('supertest');

// ✅ Mockear el modelo
jest.mock('../../models/Categoria');

const app = require('../../app');
const Categoria = require('../../models/Categoria');

// ✅ Mockear autenticación para rutas protegidas
jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.userId = 1;
    req.userRol = 'admin';
    next();
  },
  isAdmin: (req, res, next) => next()
}));

describe('Categoria Controller', () => {
  const mockCategorias = [
    { id: 1, nombre: 'Brasas', icono: '🍗', orden: 1, activo: 1 },
    { id: 2, nombre: 'Broasters', icono: '🍗', orden: 2, activo: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL
  // ============================================
  describe('GET /api/categorias', () => {
    it('debe retornar todas las categorías', async () => {
      Categoria.findAll.mockResolvedValue(mockCategorias);

      const response = await request(app).get('/api/categorias');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategorias);
      expect(Categoria.findAll).toHaveBeenCalledTimes(1);
    });

    it('debe retornar array vacío si no hay categorías', async () => {
      Categoria.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/categorias');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('debe retornar 500 si hay error', async () => {
      Categoria.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/categorias');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error al obtener categorías');
    });
  });

  // ============================================
  // GET BY ID
  // ============================================
  describe('GET /api/categorias/:id', () => {
    it('debe retornar una categoría por ID', async () => {
      Categoria.findById.mockResolvedValue(mockCategorias[0]);

      const response = await request(app).get('/api/categorias/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCategorias[0]);
      expect(Categoria.findById).toHaveBeenCalledWith('1');
    });

    it('debe retornar 404 si no existe', async () => {
      Categoria.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/categorias/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Categoría no encontrada');
    });
  });

  // ============================================
  // CREATE
  // ============================================
  describe('POST /api/categorias', () => {
    it('debe crear una categoría correctamente', async () => {
      const nuevaCategoria = {
        nombre: 'Nueva Categoría',
        icono: '🍕',
        orden: 19
      };

      Categoria.create.mockResolvedValue({ id: 19, ...nuevaCategoria });

      const response = await request(app)
        .post('/api/categorias')
        .send(nuevaCategoria);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.categoria.nombre).toBe(nuevaCategoria.nombre);
      expect(Categoria.create).toHaveBeenCalledWith({
        nombre: nuevaCategoria.nombre,
        icono: nuevaCategoria.icono,
        orden: nuevaCategoria.orden,
        descripcion: null
      });
    });

    it('debe retornar 400 si falta el nombre', async () => {
      const response = await request(app)
        .post('/api/categorias')
        .send({ icono: '🍕' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El nombre es requerido');
      expect(Categoria.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // UPDATE
  // ============================================
  describe('PUT /api/categorias/:id', () => {
    it('debe actualizar una categoría correctamente', async () => {
      Categoria.findById
        .mockResolvedValueOnce(mockCategorias[0])  // Para verificar existencia
        .mockResolvedValueOnce({ ...mockCategorias[0], nombre: 'Actualizada' }); // Para retornar actualizada
      
      Categoria.update.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/categorias/1')
        .send({ nombre: 'Actualizada' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Categoria.update).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('debe retornar 404 si no existe', async () => {
      Categoria.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/categorias/999')
        .send({ nombre: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Categoría no encontrada');
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('DELETE /api/categorias/:id', () => {
    it('debe eliminar una categoría correctamente', async () => {
      Categoria.findById.mockResolvedValue(mockCategorias[0]);
      Categoria.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/categorias/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Categoria.delete).toHaveBeenCalledWith('1');
    });

    it('debe retornar 404 si no existe', async () => {
      Categoria.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/categorias/999');

      expect(response.status).toBe(404);
    });
  });
});