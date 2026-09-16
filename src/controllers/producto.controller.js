// src/controllers/producto.controller.js
const Producto = require('../models/Producto');
const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../config/multer');
const { DEFAULT_IMAGE_NAME, getImageUrl, isDefaultImage } = require('../config/default-image');

// ============================================
// ✅ ELIMINAR IMAGEN (BLINDADO CON GUARDAS)
// ============================================
const eliminarImagenPersonalizada = (nombreImagen) => {
  // Guarda 1: sin nombre
  if (!nombreImagen) {
    console.log('ℹ️ No hay imagen para eliminar');
    return;
  }

  // Guarda 2: no es string
  if (typeof nombreImagen !== 'string') {
    console.log('ℹ️ nombreImagen no es string, se ignora');
    return;
  }

  // Guarda 3: es la default
  if (isDefaultImage(nombreImagen)) {
    console.log('ℹ️ Es la imagen por defecto, no se elimina');
    return;
  }

  // Guarda 4: nombre vacío
  const nombreLimpio = nombreImagen.trim();
  if (!nombreLimpio) {
    console.log('ℹ️ Nombre de imagen vacío, se ignora');
    return;
  }

  // Guarda 5: uploadDir undefined
  if (!uploadDir) {
    console.error('❌ uploadDir no está configurado en multer.js');
    return;
  }

  try {
    const rutaImagen = path.join(uploadDir, path.basename(nombreLimpio));

    if (fs.existsSync(rutaImagen)) {
      fs.unlinkSync(rutaImagen);
      console.log(`✅ Imagen eliminada: ${nombreLimpio}`);
    } else {
      console.log(`ℹ️ Imagen no encontrada en disco: ${nombreLimpio}`);
    }
  } catch (err) {
    console.error(`❌ Error al eliminar imagen "${nombreLimpio}":`, err.message);
    // ⚠️ NO relanzar el error — la operación principal debe continuar
  }
};

// ============================================
// GET ALL
// ============================================
exports.getAll = async (req, res) => {
  try {
    const productos = await Producto.findAll();
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

// ============================================
// GET DISPONIBLES
// ============================================
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

// ============================================
// GET BY CATEGORIA
// ============================================
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

// ============================================
// GET BY ID
// ============================================
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

// ============================================
// CREATE
// ============================================
exports.create = async (req, res) => {
  try {
    const {
      categoria_id, nombre, precio, descripcion, stock,
      disponible, agotado
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Si no se adjunta imagen se mantiene la imagen predeterminada
    let imagen = DEFAULT_IMAGE_NAME;
    if (req.file) {
      imagen = req.file.filename;
      console.log('Imagen guardada:', imagen);
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

// ============================================
// UPDATE
// ============================================
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

    // Procesar imagen
    let imagen = productoExistente.imagen || DEFAULT_IMAGE_NAME;
    if (req.file) {
      imagen = req.file.filename;
      console.log('Imagen actualizada:', imagen);
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
      if (req.file && productoExistente.imagen !== imagen) {
        eliminarImagenPersonalizada(productoExistente.imagen);
      }

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

// ============================================
// UPDATE IMAGE
// ============================================
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

    const imagen = req.file.filename;
    const actualizado = await Producto.updateImage(id, imagen);

    if (actualizado) {
      if (productoExistente.imagen !== imagen) {
        eliminarImagenPersonalizada(productoExistente.imagen);
      }

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

// ============================================
// ✅ TOGGLE DISPONIBLE (NUEVO - FALTABA)
// ============================================
exports.toggleDisponible = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // ✅ Invertir el estado agotado
    const nuevoAgotado = !producto.agotado;

    await Producto.update(id, {
      ...producto,
      agotado: nuevoAgotado
    });

    const productoActualizado = await Producto.findById(id);
    productoActualizado.imagenUrl = getImageUrl(productoActualizado.imagen);
    productoActualizado.esDefault = isDefaultImage(productoActualizado.imagen);

    res.json({
      success: true,
      message: nuevoAgotado
        ? 'Producto marcado como agotado'
        : 'Producto marcado como disponible',
      producto: productoActualizado,
      agotado: nuevoAgotado
    });
  } catch (error) {
    console.error('Error en toggleDisponible:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar disponibilidad'
    });
  }
};

// ============================================
// RESTORE DEFAULT IMAGE
// ============================================
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

    // Restaurar imagen por defecto
    const imagen = DEFAULT_IMAGE_NAME;
    const actualizado = await Producto.updateImage(id, imagen);

    if (actualizado) {
      eliminarImagenPersonalizada(productoExistente.imagen);

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

// ============================================
// DELETE
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const eliminado = await Producto.delete(id);
    if (eliminado) {
      eliminarImagenPersonalizada(producto.imagen);
      res.json({ message: 'Producto eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};