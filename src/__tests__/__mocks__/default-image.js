// src/__tests__/__mocks__/default-image.js
const DEFAULT_IMAGE_NAME = 'imagen.jpg';
const UPLOADS_DIR = '/tmp/uploads/productos';
const DEFAULT_IMAGE_PATH = `${UPLOADS_DIR}/${DEFAULT_IMAGE_NAME}`;

module.exports = {
  DEFAULT_IMAGE_NAME,
  DEFAULT_IMAGE_PATH,
  UPLOADS_DIR,
  getImageUrl: (name) => `/uploads/productos/${name || DEFAULT_IMAGE_NAME}`,
  getImageName: (name) => name || DEFAULT_IMAGE_NAME,
  isDefaultImage: (name) => !name || name === DEFAULT_IMAGE_NAME,
  ensureDefaultImage: () => {}
};