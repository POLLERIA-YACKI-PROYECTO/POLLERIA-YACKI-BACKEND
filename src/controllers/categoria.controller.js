// src\controllers\categoria.controller.js

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

exports.create = async (req, res) => {
  try {
    const { nombre, icono, orden } = req.body;
    const nuevaCategoria = await Categoria.create({ nombre, icono, orden });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, icono, orden, activo } = req.body;
    const actualizado = await Categoria.update(id, { nombre, icono, orden, activo });
    if (actualizado) {
      const categoria = await Categoria.findById(id);
      res.json(categoria);
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
    const eliminado = await Categoria.delete(id);
    if (eliminado) {
      res.json({ message: 'Categoría eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Categoría no encontrada' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};