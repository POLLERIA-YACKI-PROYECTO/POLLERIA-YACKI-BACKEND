// src/controllers/configuracion.controller.js
const Configuracion = require('../models/Configuracion');
const { validateBody } = require('../config/security');
const { logger } = require('../utils/logger');

// Obtener toda la configuración
exports.getAll = async (req, res) => {
  try {
    const config = await Configuracion.findAll();
    logger.info(`Configuración obtenida: ${config.length} registros`);
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error en getAll config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

// Obtener configuración por clave
exports.getByClave = async (req, res) => {
  try {
    const { clave } = req.params;
    
    // Sanitizar clave
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');
    
    const config = await Configuracion.findByClave(cleanClave);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error en getByClave:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

// Actualizar configuración con validación
exports.update = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;
    
    // Validar que valor existe
    if (valor === undefined || valor === null) {
      return res.status(400).json({
        success: false,
        error: 'El valor es requerido'
      });
    }
    
    // Sanitizar clave
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Verificar que existe
    const existe = await Configuracion.findByClave(cleanClave);
    if (!existe) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }
    
    // Validar valor según tipo
    let valorValidado = valor;
    
    if (existe.tipo === 'numero') {
      const num = parseFloat(valor);
      if (isNaN(num)) {
        return res.status(400).json({
          success: false,
          error: 'El valor debe ser un número'
        });
      }
      valorValidado = num.toString();
    }
    
    if (existe.tipo === 'booleano') {
      if (valor !== 'true' && valor !== 'false' && valor !== '1' && valor !== '0') {
        return res.status(400).json({
          success: false,
          error: 'El valor debe ser booleano (true/false)'
        });
      }
    }
    
    if (existe.tipo === 'json') {
      try {
        JSON.parse(valor);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'El valor debe ser un JSON válido'
        });
      }
    }
    
    const actualizado = await Configuracion.update(cleanClave, valorValidado);
    
    if (actualizado) {
      const configActualizada = await Configuracion.findByClave(cleanClave);
      logger.info(`Configuración actualizada: ${cleanClave} = ${valor}`);
      res.json({
        success: true,
        message: 'Configuración actualizada correctamente',
        data: configActualizada
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo actualizar la configuración'
      });
    }
  } catch (error) {
    logger.error('Error en update config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración'
    });
  }
};

// Crear nueva configuración
exports.create = async (req, res) => {
  try {
    const { clave, valor, tipo, descripcion } = req.body;
    
    // Validaciones
    if (!clave) {
      return res.status(400).json({
        success: false,
        error: 'La clave es requerida'
      });
    }
    
    if (valor === undefined || valor === null) {
      return res.status(400).json({
        success: false,
        error: 'El valor es requerido'
      });
    }
    
    // Sanitizar clave
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Verificar que no existe
    const existe = await Configuracion.findByClave(cleanClave);
    if (existe) {
      return res.status(400).json({
        success: false,
        error: 'La clave ya existe'
      });
    }
    
    // Validar tipos permitidos
    const tiposPermitidos = ['texto', 'numero', 'booleano', 'json'];
    const tipoValidado = tipo && tiposPermitidos.includes(tipo) ? tipo : 'texto';
    
    const nuevaConfig = await Configuracion.create({
      clave: cleanClave,
      valor,
      tipo: tipoValidado,
      descripcion: descripcion || null
    });
    
    logger.info(`Nueva configuración creada: ${cleanClave}`);
    res.status(201).json({
      success: true,
      message: 'Configuración creada correctamente',
      data: nuevaConfig
    });
  } catch (error) {
    logger.error('Error en create config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear configuración'
    });
  }
};

// Eliminar configuración
exports.delete = async (req, res) => {
  try {
    const { clave } = req.params;
    
    // Sanitizar clave
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Verificar que existe
    const existe = await Configuracion.findByClave(cleanClave);
    if (!existe) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }
    
    const eliminado = await Configuracion.delete(cleanClave);
    
    if (eliminado) {
      logger.info(`Configuración eliminada: ${cleanClave}`);
      res.json({
        success: true,
        message: 'Configuración eliminada correctamente'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo eliminar la configuración'
      });
    }
  } catch (error) {
    logger.error('Error en delete config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar configuración'
    });
  }
};