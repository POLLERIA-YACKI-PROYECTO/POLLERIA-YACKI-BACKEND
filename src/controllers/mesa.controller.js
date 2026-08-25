const Mesa = require('../models/Mesa');

exports.getAll = async (req, res) => {
  try {
    const mesas = await Mesa.findAll();
    res.json(mesas);
  } catch (error) {
    console.error('Error en getAll mesas:', error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findById(id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    res.json(mesa);
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ error: 'Error al obtener mesa' });
  }
};

exports.create = async (req, res) => {
  try {
    const { numero, capacidad } = req.body;
    if (!numero) {
      return res.status(400).json({ error: 'Número de mesa es requerido' });
    }
    const nuevaMesa = await Mesa.create({ numero, capacidad });
    res.status(201).json(nuevaMesa);
  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ error: 'Error al crear mesa' });
  }
};

exports.ocuparMesa = async (req, res) => {
  try {
    const { numero } = req.params;
    const { cliente } = req.body;
    const mesa = await Mesa.findByNumero(numero);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    if (mesa.ocupada) {
      return res.status(400).json({ error: 'La mesa ya está ocupada' });
    }
    const ocupado = await Mesa.ocuparMesa(numero, cliente);
    if (ocupado) {
      const mesaActualizada = await Mesa.findByNumero(numero);
      res.json(mesaActualizada);
    } else {
      res.status(400).json({ error: 'No se pudo ocupar la mesa' });
    }
  } catch (error) {
    console.error('Error en ocuparMesa:', error);
    res.status(500).json({ error: 'Error al ocupar mesa' });
  }
};

exports.liberarMesa = async (req, res) => {
  try {
    const { numero } = req.params;
    const mesa = await Mesa.findByNumero(numero);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    const liberado = await Mesa.liberarMesa(numero);
    if (liberado) {
      const mesaActualizada = await Mesa.findByNumero(numero);
      res.json(mesaActualizada);
    } else {
      res.status(400).json({ error: 'No se pudo liberar la mesa' });
    }
  } catch (error) {
    console.error('Error en liberarMesa:', error);
    res.status(500).json({ error: 'Error al liberar mesa' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Mesa.delete(id);
    if (eliminado) {
      res.json({ message: 'Mesa eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Mesa no encontrada' });
    }
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ error: 'Error al eliminar mesa' });
  }
};