// src/config/default-image.js
const path = require('path');
const fs = require('fs');

// ============================================
// CONSTANTES
// ============================================
const DEFAULT_IMAGE_NAME = 'imagen.jpg';
const UPLOADS_DIR = path.join(__dirname, '../../uploads/productos');
const DEFAULT_IMAGE_PATH = path.join(UPLOADS_DIR, DEFAULT_IMAGE_NAME);

// ============================================
// VERIFICAR QUE LA IMAGEN POR DEFECTO EXISTE
// ============================================
const ensureDefaultImage = () => {
  // Crear directorio si no existe
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('[DEFAULT-IMAGE] Directorio de uploads creado:', UPLOADS_DIR);
  }

  // Verificar si la imagen por defecto existe
  if (!fs.existsSync(DEFAULT_IMAGE_PATH)) {
    console.warn('[DEFAULT-IMAGE] Imagen por defecto NO encontrada en:', DEFAULT_IMAGE_PATH);
    console.warn('[DEFAULT-IMAGE] Coloca una imagen llamada "imagen.jpg" en la carpeta uploads/productos/');
  } else {
    console.log('[DEFAULT-IMAGE] Imagen por defecto encontrada');
  }
};

// ============================================
// OBTENER URL DE LA IMAGEN
// ============================================
const getImageUrl = (imagen) => {
  // Guarda 1: si no hay imagen, retornar la default
  if (!imagen) {
    return `/uploads/productos/${DEFAULT_IMAGE_NAME}`;
  }

  // Guarda 2: si es un objeto (por error), convertir a string
  if (typeof imagen === 'object') {
    console.warn('[DEFAULT-IMAGE] Imagen es un objeto, se esperaba string:', imagen);
    return `/uploads/productos/${DEFAULT_IMAGE_NAME}`;
  }

  // Guarda 3: si es la default, retornar la default
  const imagenStr = String(imagen).trim();
  if (imagenStr === DEFAULT_IMAGE_NAME) {
    return `/uploads/productos/${DEFAULT_IMAGE_NAME}`;
  }

  // Guarda 4: si ya es una URL completa, retornarla tal cual
  if (
    imagenStr.startsWith('http://') ||
    imagenStr.startsWith('https://') ||
    imagenStr.startsWith('data:') ||
    imagenStr.startsWith('blob:') ||
    imagenStr.startsWith('/uploads/')
  ) {
    return imagenStr;
  }

  return `/uploads/productos/${imagenStr}`;
};

// ============================================
// OBTENER NOMBRE DE LA IMAGEN
// ============================================
const getImageName = (imagen) => {
  // Guarda: si no hay imagen, retornar la default
  if (!imagen || typeof imagen !== 'string' || !imagen.trim()) {
    return DEFAULT_IMAGE_NAME;
  }
  return imagen.trim();
};

// ============================================
// VERIFICAR SI ES LA IMAGEN POR DEFECTO
// ============================================
const isDefaultImage = (imagen) => {
  // Guarda: si no hay imagen, ES la default
  if (!imagen) return true;

  // Guarda: si es un objeto, ES la default (no debería pasar)
  if (typeof imagen !== 'string') return true;

  return imagen.trim() === DEFAULT_IMAGE_NAME;
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  DEFAULT_IMAGE_NAME,
  DEFAULT_IMAGE_PATH,
  UPLOADS_DIR,           // AGREGADO (útil para otros módulos)
  ensureDefaultImage,
  getImageUrl,
  getImageName,
  isDefaultImage
};