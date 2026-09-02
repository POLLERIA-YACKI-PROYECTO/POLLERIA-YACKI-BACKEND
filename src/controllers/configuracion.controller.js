// src\controllers\configuracion.controller.js

const Configuracion = require('../models/Configuracion');

exports.getAll = async (req, res) => {
  try {
    const config = await Configuracion.findAll();
    res.json(config);
  } catch (error) {
    console.error('Error en getAll config:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

exports.update = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;
    const actualizado = await Configuracion.update(clave, valor);
    if (actualizado) {
      res.json({ clave, valor });
    } else {
      res.status(404).json({ error: 'Clave no encontrada' });
    }
  } catch (error) {
    console.error('Error en update config:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};