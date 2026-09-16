// src/controllers/configuracion.controller.js
const Configuracion = require('../models/Configuracion');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { uploadDirConfig } = require('../config/multer');
const { logger } = require('../utils/logger');

// ============================================
// CLAVES PERMITIDAS
// ============================================
const CLAVES_VALIDAS = [
  // Empresa
  'EMPRESA_NOMBRE',
  'EMPRESA_RUC',
  'EMPRESA_DIRECCION',
  'EMPRESA_TELEFONO',
  'IGV',
  'MONEDA_SIMBOLO',
  // Redes sociales
  'INSTAGRAM',
  'FACEBOOK',
  'TIKTOK',
  // Delivery
  'DELIVERY_TELEFONO',
  'DELIVERY_COSTO',
  // Horarios
  'HORARIO_APERTURA',
  'HORARIO_CIERRE',
  'DIAS_LABORALES',
  'TIEMPO_ESTIMADO_PREPARACION',
  // Pagos: Yape
  'YAPE_NUMERO',
  'YAPE_TITULAR',
  'YAPE_QR',
  // Pagos: Plin
  'PLIN_NUMERO',
  'PLIN_TITULAR',
  'PLIN_QR',
  // Pagos: Izipay
  'IZIPAY_QR',
  'IZIPAY_COMERCIO',
  'TARJETA_IZIPAY',
  // Pagos: Efectivo
  'EFECTIVO_MENSAJE',
  // Sistema
  'MESAS_ACTIVAS',
  'MAXIMO_PEDIDOS_MESA',
  'PERMITE_CANCELAR_PEDIDOS'
];

// Claves que el cliente puede ver (sin autenticación)
const CLAVES_PUBLICAS = [
  'EMPRESA_NOMBRE',
  'EMPRESA_RUC',
  'EMPRESA_DIRECCION',
  'EMPRESA_TELEFONO',
  'IGV',
  'MONEDA_SIMBOLO',
  'INSTAGRAM',
  'FACEBOOK',
  'TIKTOK',
  'DELIVERY_TELEFONO',
  'DELIVERY_COSTO',
  'HORARIO_APERTURA',
  'HORARIO_CIERRE',
  'DIAS_LABORALES',
  'TIEMPO_ESTIMADO_PREPARACION',
  'YAPE_NUMERO',
  'YAPE_TITULAR',
  'YAPE_QR',
  'PLIN_NUMERO',
  'PLIN_TITULAR',
  'PLIN_QR',
  'IZIPAY_QR',
  'IZIPAY_COMERCIO',
  'TARJETA_IZIPAY',
  'EFECTIVO_MENSAJE'
];

// ============================================
// HELPER: URL pública de imagen
// ============================================
const getImagenConfigUrl = (valor) => {
  if (!valor || typeof valor !== 'string' || !valor.trim()) return null;
  const v = valor.trim();
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:')) {
    return v;
  }
  return `/uploads/configuracion/${v}`;
};

// ============================================
// HELPER: Normalizar valor según tipo
// ============================================
const normalizarValor = (valor, tipo) => {
  if (valor === null || valor === undefined) return null;

  switch (tipo) {
    case 'numero': {
      const n = Number(valor);
      return Number.isFinite(n) ? n : 0;
    }
    case 'booleano':
      return valor === true || valor === 'true' || valor === 1 || valor === '1';
    case 'json':
      if (typeof valor === 'string') {
        try { return JSON.parse(valor); } catch { return valor; }
      }
      return valor;
    default:
      return String(valor);
  }
};

// ============================================
// HELPER: Detectar tipo desde el valor
// ============================================
const detectarTipo = (valor) => {
  if (typeof valor === 'number') return 'numero';
  if (typeof valor === 'boolean') return 'booleano';
  if (typeof valor === 'object' && valor !== null) return 'json';
  return 'texto';
};

// ============================================
// GET PÚBLICAS (sin token) — para la carta cliente
// ============================================
exports.getPublicas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT clave, valor, tipo FROM configuracion
       WHERE clave IN (?) AND deleted_at IS NULL`,
      [CLAVES_PUBLICAS]
    );

    const config = {};
    rows.forEach((r) => {
      config[r.clave] = normalizarValor(r.valor, r.tipo);
    });

    // Añadir URL completa de QRs
    if (config.YAPE_QR) config.YAPE_QR_URL = getImagenConfigUrl(config.YAPE_QR);
    if (config.PLIN_QR) config.PLIN_QR_URL = getImagenConfigUrl(config.PLIN_QR);
    if (config.IZIPAY_QR) config.IZIPAY_QR_URL = getImagenConfigUrl(config.IZIPAY_QR);

    res.json({ success: true, config });
  } catch (error) {
    logger.error('Error en getPublicas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración pública'
    });
  }
};

// ============================================
// GET ALL (admin) — con token
// ============================================
exports.getAll = async (req, res) => {
  try {
    const rows = await Configuracion.findAll();

    const config = {};
    rows.forEach((r) => {
      config[r.clave] = normalizarValor(r.valor, r.tipo);
    });

    // Añadir URL completa de QRs
    if (config.YAPE_QR) config.YAPE_QR_URL = getImagenConfigUrl(config.YAPE_QR);
    if (config.PLIN_QR) config.PLIN_QR_URL = getImagenConfigUrl(config.PLIN_QR);
    if (config.IZIPAY_QR) config.IZIPAY_QR_URL = getImagenConfigUrl(config.IZIPAY_QR);

    res.json({
      success: true,
      config,
      raw: rows
    });
  } catch (error) {
    logger.error('Error en getAll configuracion:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

// ============================================
// GET BY CLAVE
// ============================================
exports.getByClave = async (req, res) => {
  try {
    const { clave } = req.params;
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');

    const config = await Configuracion.findByClave(cleanClave);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    const valorNormalizado = normalizarValor(config.valor, config.tipo);

    res.json({
      success: true,
      data: {
        clave: config.clave,
        valor: valorNormalizado,
        tipo: config.tipo,
        descripcion: config.descripcion
      }
    });
  } catch (error) {
    logger.error('Error en getByClave:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

// ============================================
// UPDATE — batch (varias claves a la vez)
// ============================================
exports.update = async (req, res) => {
  try {
    const cambios = req.body || {};
    const usuarioId = req.userId;

    // Filtrar solo claves válidas
    const claves = Object.keys(cambios).filter((k) => CLAVES_VALIDAS.includes(k));

    if (claves.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay claves válidas para actualizar'
      });
    }

    for (const clave of claves) {
      let valor = cambios[clave];
      const tipo = detectarTipo(valor);

      if (tipo === 'json') {
        valor = JSON.stringify(valor);
      } else if (tipo === 'booleano') {
        valor = valor ? 'true' : 'false';
      } else {
        valor = String(valor ?? '');
      }

      await db.query(
        `INSERT INTO configuracion (clave, valor, tipo, updated_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           valor = VALUES(valor),
           tipo = VALUES(tipo),
           updated_at = NOW()`,
        [clave, valor, tipo]
      );
    }

    // Log de auditoría
    try {
      await db.query(
        `INSERT INTO logs (usuario_id, accion, tabla, datos_nuevos, created_at)
         VALUES (?, 'UPDATE_CONFIG', 'configuracion', ?, NOW())`,
        [usuarioId || null, JSON.stringify({ claves })]
      );
    } catch (e) {
      /* no bloquear */
    }

    logger.info(`Configuración actualizada: ${claves.length} claves`);

    res.json({
      success: true,
      message: `Configuración actualizada (${claves.length} valores)`
    });
  } catch (error) {
    logger.error('Error en update configuracion:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración'
    });
  }
};

// ============================================
// CREATE (nueva clave — raro, pero por si acaso)
// ============================================
exports.create = async (req, res) => {
  try {
    const { clave, valor, tipo, descripcion } = req.body;

    if (!clave || valor === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Clave y valor son requeridos'
      });
    }

    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');

    if (!CLAVES_VALIDAS.includes(cleanClave)) {
      return res.status(400).json({
        success: false,
        error: `Clave "${cleanClave}" no está permitida`
      });
    }

    const existe = await Configuracion.findByClave(cleanClave);
    if (existe) {
      return res.status(400).json({
        success: false,
        error: 'La clave ya existe'
      });
    }

    const tipoFinal = tipo || detectarTipo(valor);

    const nueva = await Configuracion.create({
      clave: cleanClave,
      valor: String(valor),
      tipo: tipoFinal,
      descripcion: descripcion || null
    });

    logger.info(`Nueva configuración creada: ${cleanClave}`);

    res.status(201).json({
      success: true,
      message: 'Configuración creada correctamente',
      data: nueva
    });
  } catch (error) {
    logger.error('Error en create config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear configuración'
    });
  }
};

// ============================================
// SUBIR IMAGEN (QR Yape/Plin/Izipay)
// ============================================
exports.subirImagen = async (req, res) => {
  try {
    const { clave } = req.body;

    if (!clave || !CLAVES_VALIDAS.includes(clave)) {
      // Eliminar el archivo subido si la clave no es válida
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      }
      return res.status(400).json({
        success: false,
        error: 'Clave inválida'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ninguna imagen'
      });
    }

    const nombreArchivo = req.file.filename;

    // Obtener valor anterior para eliminarlo
    const anterior = await Configuracion.findByClave(clave);

    await db.query(
      `INSERT INTO configuracion (clave, valor, tipo, updated_at)
       VALUES (?, ?, 'texto', NOW())
       ON DUPLICATE KEY UPDATE
         valor = VALUES(valor),
         updated_at = NOW()`,
      [clave, nombreArchivo]
    );

    // Eliminar archivo anterior
    if (anterior?.valor && anterior.valor !== nombreArchivo) {
      try {
        const rutaAnterior = path.join(
          uploadDirConfig,
          path.basename(anterior.valor)
        );
        if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
      } catch (e) {
        /* ignore */
      }
    }

    logger.info(`Imagen de configuración subida: ${clave} → ${nombreArchivo}`);

    res.json({
      success: true,
      message: 'Imagen subida correctamente',
      archivo: nombreArchivo,
      url: getImagenConfigUrl(nombreArchivo)
    });
  } catch (error) {
    logger.error('Error en subirImagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imagen'
    });
  }
};

// ============================================
// ELIMINAR IMAGEN
// ============================================
exports.eliminarImagen = async (req, res) => {
  try {
    const { clave } = req.params;

    if (!clave || !CLAVES_VALIDAS.includes(clave)) {
      return res.status(400).json({
        success: false,
        error: 'Clave inválida'
      });
    }

    const config = await Configuracion.findByClave(clave);

    if (config?.valor) {
      try {
        const ruta = path.join(uploadDirConfig, path.basename(config.valor));
        if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
      } catch (e) {
        /* ignore */
      }
    }

    await db.query(
      `UPDATE configuracion SET valor = NULL, updated_at = NOW() WHERE clave = ?`,
      [clave]
    );

    logger.info(`Imagen de configuración eliminada: ${clave}`);

    res.json({
      success: true,
      message: 'Imagen eliminada'
    });
  } catch (error) {
    logger.error('Error en eliminarImagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar imagen'
    });
  }
};

// ============================================
// DELETE (soft delete de una clave)
// ============================================
exports.delete = async (req, res) => {
  try {
    const { clave } = req.params;
    const cleanClave = clave.replace(/[^a-zA-Z0-9_]/g, '');

    const existe = await Configuracion.findByClave(cleanClave);
    if (!existe) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    const eliminado = await Configuracion.delete(cleanClave);

    if (eliminado) {
      res.json({
        success: true,
        message: 'Configuración eliminada'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo eliminar'
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