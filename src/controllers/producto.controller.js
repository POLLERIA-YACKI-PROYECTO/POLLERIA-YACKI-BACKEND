// src/controllers/producto.controller.js
const Producto = require('../models/Producto');
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../config/multer');
const { DEFAULT_IMAGE_NAME, getImageUrl, isDefaultImage } = require('../config/default-image');

// Obtener todos los productos (con URL de imagen)
exports.getAll = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    // ✅ Agregar URL completa de la imagen
    const productosConUrl = productos.map(p => ({
      ...p,
      imagenUrl: getImageUrl(p.imagen),
      esDefault: isDefaultImage(p.imagen)
    }));
    res.json(productosConUrl);
  } catch (error) {
    console.error('Error en getAll productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener productos disponibles
exports.getDisponibles = async (req, res) => {
  try {
    const productos = await Producto.findAvailable();
    const productosConUrl = productos.map(p => ({
      ...p,
      imagenUrl: getImageUrl(p.imagen),
      esDefault: isDefaultImage(p.imagen)
    }));
    res.json(productosConUrl);
  } catch (error) {
    console.error('Error en getDisponibles:', error);
    res.status(500).json({ error: 'Error al obtener productos disponibles' });
  }
};

// Obtener productos por categoría
exports.getByCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const productos = await Producto.findByCategoria(categoriaId);
    const productosConUrl = productos.map(p => ({
      ...p,
      imagenUrl: getImageUrl(p.imagen),
      esDefault: isDefaultImage(p.imagen)
    }));
    res.json(productosConUrl);
  } catch (error) {
    console.error('Error en getByCategoria:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    producto.imagenUrl = getImageUrl(producto.imagen);
    producto.esDefault = isDefaultImage(producto.imagen);
    res.json(producto);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear producto con imagen
exports.create = async (req, res) => {
  try {
    const { 
      categoria_id, nombre, precio, descripcion, stock, 
      disponible, agotado 
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // ✅ Si hay imagen, se guarda como imagen.jpg
    let imagen = DEFAULT_IMAGE_NAME;
    if (req.file) {
      imagen = req.file.filename; // Siempre será 'imagen.jpg'
      console.log('📸 Imagen guardada:', imagen);
    }

    const nuevoProducto = await Producto.create({
      categoria_id, 
      nombre, 
      precio: parseFloat(precio), 
      descripcion,
      stock: stock || 0,
      disponible: disponible !== undefined ? disponible === 'true' : true,
      agotado: agotado !== undefined ? agotado === 'true' : false,
      imagen
    });

    const productoConUrl = {
      ...nuevoProducto,
      imagenUrl: getImageUrl(imagen),
      esDefault: isDefaultImage(imagen)
    };

    res.status(201).json(productoConUrl);
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, precio, descripcion, categoria_id, stock, 
      disponible, agotado 
    } = req.body;

    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // ✅ Procesar imagen
    let imagen = productoExistente.imagen || DEFAULT_IMAGE_NAME;
    if (req.file) {
      imagen = req.file.filename; // Siempre será 'imagen.jpg'
      console.log('📸 Imagen actualizada:', imagen);
    }

    const actualizado = await Producto.update(id, {
      nombre, 
      precio: parseFloat(precio), 
      descripcion,
      categoria_id,
      stock: stock || 0,
      disponible: disponible !== undefined ? disponible === 'true' : productoExistente.disponible,
      agotado: agotado !== undefined ? agotado === 'true' : productoExistente.agotado,
      imagen
    });

    if (actualizado) {
      const producto = await Producto.findById(id);
      producto.imagenUrl = getImageUrl(producto.imagen);
      producto.esDefault = isDefaultImage(producto.imagen);
      res.json(producto);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// ✅ Actualizar SOLO la imagen
exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ninguna imagen'
      });
    }

    // ✅ Siempre se guarda como imagen.jpg
    const imagen = req.file.filename;
    const actualizado = await Producto.updateImage(id, imagen);

    if (actualizado) {
      const producto = await Producto.findById(id);
      producto.imagenUrl = getImageUrl(imagen);
      producto.esDefault = isDefaultImage(imagen);
      res.json({
        success: true,
        message: 'Imagen actualizada correctamente',
        producto
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo actualizar la imagen'
      });
    }
  } catch (error) {
    console.error('Error en updateImage:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar imagen'
    });
  }
};

// ✅ Restaurar imagen por defecto
exports.restoreDefaultImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // ✅ Restaurar imagen por defecto
    const imagen = DEFAULT_IMAGE_NAME;
    const actualizado = await Producto.updateImage(id, imagen);

    if (actualizado) {
      const producto = await Producto.findById(id);
      producto.imagenUrl = getImageUrl(imagen);
      producto.esDefault = true;
      res.json({
        success: true,
        message: 'Imagen por defecto restaurada',
        producto
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo restaurar la imagen por defecto'
      });
    }
  } catch (error) {
    console.error('Error en restoreDefaultImage:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restaurar imagen por defecto'
    });
  }
};

// Eliminar producto
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

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