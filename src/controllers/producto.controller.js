const Producto = require('../models/Producto');

exports.getAll = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    console.error('Error en getAll productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.getByCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const productos = await Producto.findByCategoria(categoriaId);
    res.json(productos);
  } catch (error) {
    console.error('Error en getByCategoria:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

exports.create = async (req, res) => {
  try {
    const { categoria_id, nombre, precio, descripcion } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    const nuevoProducto = await Producto.create({ categoria_id, nombre, precio, descripcion });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion, categoria_id } = req.body;
    const actualizado = await Producto.update(id, { nombre, precio, descripcion, categoria_id });
    if (actualizado) {
      const producto = await Producto.findById(id);
      res.json(producto);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

exports.toggleDisponible = async (req, res) => {
  try {
    const { id } = req.params;
    const nuevoEstado = await Producto.toggleAgotado(id);
    if (nuevoEstado === null) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ id: parseInt(id), agotado: nuevoEstado });
  } catch (error) {
    console.error('Error en toggleDisponible:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Producto.delete(id);
    if (eliminado) {
      res.json({ message: 'Producto eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};