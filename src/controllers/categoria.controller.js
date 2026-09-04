// src/controllers/categoria.controller.js

const Categoria = require('../models/Categoria');

exports.getAll = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (error) {
    console.error('Error en getAll categorias:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

exports.getActive = async (req, res) => {
  try {
    const categorias = await Categoria.findActive();
    res.json(categorias);
  } catch (error) {
    console.error('Error en getActive categorias:', error);
    res.status(500).json({ error: 'Error al obtener categorías activas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(categoria);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// ✅ NUEVO: Obtener productos por categoría
exports.getProductos = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    const productos = await Categoria.getProductosByCategoria(id);
    res.json(productos);
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ error: 'Error al obtener productos de la categoría' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, icono, orden, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const nuevaCategoria = await Categoria.create({ 
      nombre, 
      icono: icono || null, 
      orden: orden || 0,
      descripcion: descripcion || null
    });
    
    res.status(201).json({ 
      success: true, 
      categoria: nuevaCategoria,
      message: 'Categoría creada exitosamente'
    });
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, icono, orden, activo, descripcion } = req.body;
    
    const categoriaExistente = await Categoria.findById(id);
    if (!categoriaExistente) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    const actualizado = await Categoria.update(id, { 
      nombre, 
      icono, 
      orden, 
      activo,
      descripcion
    });
    
    if (actualizado) {
      const categoria = await Categoria.findById(id);
      res.json({ 
        success: true, 
        categoria,
        message: 'Categoría actualizada exitosamente'
      });
    } else {
      res.status(404).json({ error: 'Categoría no encontrada' });
    }
  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoriaExistente = await Categoria.findById(id);
    if (!categoriaExistente) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    const eliminado = await Categoria.delete(id);
    if (eliminado) {
      res.json({ 
        success: true, 
        message: 'Categoría eliminada correctamente' 
      });
    } else {
      res.status(404).json({ error: 'Categoría no encontrada' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};