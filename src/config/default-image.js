// src/config/default-image.js
const path = require('path');
const fs = require('fs');

// Ruta de la imagen por defecto
const DEFAULT_IMAGE_NAME = 'imagen.jpg';
const DEFAULT_IMAGE_PATH = path.join(__dirname, '../../uploads/productos', DEFAULT_IMAGE_NAME);

// Verificar que la imagen por defecto existe
const ensureDefaultImage = () => {
  const uploadDir = path.join(__dirname, '../../uploads/productos');
  
  // Crear directorio si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Directorio de uploads creado:', uploadDir);
  }
  
  // Verificar si la imagen por defecto existe
  if (!fs.existsSync(DEFAULT_IMAGE_PATH)) {
    console.log('⚠️ Imagen por defecto no encontrada en:', DEFAULT_IMAGE_PATH);
    console.log('📝 Coloca una imagen llamada "imagen.jpg" en la carpeta uploads/productos/');
    console.log('📝 O crea un archivo manualmente');
  } else {
    console.log('✅ Imagen por defecto encontrada:', DEFAULT_IMAGE_PATH);
  }
};

// Obtener URL de la imagen
const getImageUrl = (imagen) => {
  if (!imagen) {
    return `/uploads/productos/${DEFAULT_IMAGE_NAME}`;
  }
  if (imagen === DEFAULT_IMAGE_NAME) {
    return `/uploads/productos/${DEFAULT_IMAGE_NAME}`;
  }
  return `/uploads/productos/${imagen}`;
};

// Obtener nombre de la imagen
const getImageName = (imagen) => {
  if (!imagen) {
    return DEFAULT_IMAGE_NAME;
  }
  return imagen;
};

// Verificar si es la imagen por defecto
const isDefaultImage = (imagen) => {
  return !imagen || imagen === DEFAULT_IMAGE_NAME;
};

module.exports = {
  DEFAULT_IMAGE_NAME,
  DEFAULT_IMAGE_PATH,
  ensureDefaultImage,
  getImageUrl,
  getImageName,
  isDefaultImage
};