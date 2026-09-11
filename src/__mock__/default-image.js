// src/__mocks__/default-image.js
module.exports = {
  DEFAULT_IMAGE_NAME: 'imagen.jpg',
  DEFAULT_IMAGE_PATH: '/tmp/uploads/productos/imagen.jpg',
  getImageUrl: (name) => `/uploads/productos/${name || 'imagen.jpg'}`,
  getImageName: (name) => name || 'imagen.jpg',
  isDefaultImage: (name) => !name || name === 'imagen.jpg',
  ensureDefaultImage: () => {}
};