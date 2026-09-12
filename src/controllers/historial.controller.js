// src/controllers/historial.controller.js
const HistorialActividad = require('../models/HistorialActividad');

exports.getAll = async (req, res) => {
  try {
    const { limit = 100, offset = 0, accion, tipo_usuario } = req.query;
    const registros = await HistorialActividad.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      accion,
      tipo_usuario
    });
    res.json(registros);
  } catch (error) {
    console.error('Error en getAll historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

exports.resumenClientes = async (req, res) => {
  try {
    res.json(await HistorialActividad.resumenClientes());
  } catch (error) {
    console.error('Error en resumenClientes:', error);
    res.status(500).json({ error: 'Error al obtener resumen de clientes' });
  }
};

exports.clientesSinCompras = async (req, res) => {
  try {
    res.json(await HistorialActividad.clientesSinCompras());
  } catch (error) {
    console.error('Error en clientesSinCompras:', error);
    res.status(500).json({ error: 'Error al obtener clientes sin compras' });
  }
};

exports.clientesConCompras = async (req, res) => {
  try {
    res.json(await HistorialActividad.clientesConCompras());
  } catch (error) {
    console.error('Error en clientesConCompras:', error);
    res.status(500).json({ error: 'Error al obtener clientes con compras' });
  }
};

exports.usuariosActivos = async (req, res) => {
  try {
    res.json(await HistorialActividad.usuariosActivos());
  } catch (error) {
    console.error('Error en usuariosActivos:', error);
    res.status(500).json({ error: 'Error al obtener usuarios activos' });
  }
};

exports.estadisticas = async (req, res) => {
  try {
    res.json(await HistorialActividad.estadisticas());
  } catch (error) {
    console.error('Error en estadisticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// NUEVO: todo en una sola petición
exports.resumenCompleto = async (req, res) => {
  try {
    const [estadisticas, clientes, clientesConCompras, clientesSinCompras] = await Promise.all([
      HistorialActividad.estadisticas(),
      HistorialActividad.resumenClientes(),
      HistorialActividad.clientesConCompras(),
      HistorialActividad.clientesSinCompras()
    ]);

    res.json({
      estadisticas,
      clientes,
      clientesConCompras,
      clientesSinCompras
    });
  } catch (error) {
    console.error('Error en resumenCompleto:', error);
    res.status(500).json({ error: 'Error al obtener resumen completo' });
  }
};