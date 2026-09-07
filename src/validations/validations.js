// src/validations/validations.js
const Joi = require('joi');

const schemas = {
  usuario: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    apellido: Joi.string().min(2).max(100).allow(null),
    dni: Joi.string().pattern(/^[0-9]{8}$/).required(),
    email: Joi.string().email().allow(null),
    telefono: Joi.string().pattern(/^[0-9]{9}$/).allow(null),
    rol: Joi.string().valid('admin', 'cajero', 'mesero', 'cocinero', 'delivery'),
    password: Joi.string().min(6).required(),
    salario: Joi.number().min(0).allow(null)
  }),

  cliente: Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    apellido: Joi.string().min(2).max(100).allow(null),
    dni: Joi.string().pattern(/^[0-9]{8}$/).allow(null),
    email: Joi.string().email().allow(null),
    telefono: Joi.string().pattern(/^[0-9]{9}$/).allow(null),
    direccion: Joi.string().max(255).allow(null)
  }),

  producto: Joi.object({
    categoria_id: Joi.number().integer().positive().required(),
    nombre: Joi.string().min(2).max(100).required(),
    precio: Joi.number().min(0).required(),
    precio_compra: Joi.number().min(0).allow(null),
    descripcion: Joi.string().max(255).allow(null),
    stock: Joi.number().integer().min(0).default(0),
    stock_minimo: Joi.number().integer().min(0).default(5),
    unidad_medida: Joi.string().max(20).default('unidad'),
    disponible: Joi.boolean().default(true),
    agotado: Joi.boolean().default(false)
  }),

  pedido: Joi.object({
    mesa_id: Joi.number().integer().positive().allow(null),
    items: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        nombre: Joi.string().required(),
        cantidad: Joi.number().integer().min(1).required(),
        precio: Joi.number().min(0).required(),
        subtotal: Joi.number().min(0)
      })
    ).min(1).required(),
    total: Joi.number().min(0).required(),
    cliente_nombre: Joi.string().min(2).max(100).allow(null),
    cliente_id: Joi.number().integer().positive().allow(null),
    tipo: Joi.string().valid('local', 'delivery', 'paraLlevar').default('local'),
    tipo_entrega: Joi.string().valid('local', 'delivery', 'paraLlevar').default('local'),
    observaciones: Joi.string().max(500).allow(null),
    metodo_pago: Joi.string().valid('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia').allow(null),
    pagado: Joi.boolean().default(false)
  }),

  login: Joi.object({
    dni: Joi.string().pattern(/^[0-9]{8}$/).required()
  }),

  pago: Joi.object({
    metodo_pago: Joi.string().valid('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia').required()
  }),

  estado: Joi.object({
    estado: Joi.string().valid('pendiente', 'preparando', 'listo', 'entregado', 'cancelado').required()
  }),

  configuracion: Joi.object({
    valor: Joi.string().required()
  }),

  mesa: Joi.object({
    numero: Joi.number().integer().positive().required(),
    capacidad: Joi.number().integer().min(1).max(20).default(4),
    ubicacion: Joi.string().max(50).allow(null)
  }),

  ocuparMesa: Joi.object({
    cliente: Joi.string().min(2).max(100).required(),
    cantidad_personas: Joi.number().integer().min(1).max(20).default(1)
  })
};

module.exports = schemas;