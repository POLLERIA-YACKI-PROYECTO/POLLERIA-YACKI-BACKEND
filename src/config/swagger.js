// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.SWAGGER_TITLE || 'Polleria Yacky API',
      description:
        process.env.SWAGGER_DESCRIPTION ||
        'API para el sistema de gestión de Polleria Yacky',
      version: process.env.SWAGGER_VERSION || '1.0.0',
      contact: {
        name: 'Polleria Yacky',
        email: process.env.SWAGGER_CONTACT_EMAIL || 'contacto@polleriayacky.com',
        url: 'https://polleriayacky.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000/api',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.polleriayacky.com/api',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT obtenido al iniciar sesión'
        }
      },
      schemas: {
        // ============================================
        // RESPUESTAS GENÉRICAS
        // ============================================
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error al procesar la solicitud' },
            message: { type: 'string', example: 'Mensaje de error' },
            details: {
              type: 'array',
              items: { type: 'string' },
              example: ['El campo nombre es requerido']
            }
          }
        },

        // ============================================
        // LOGIN PERSONAL (por DNI)
        // ============================================
        LoginRequest: {
          type: 'object',
          required: ['dni'],
          properties: {
            dni: {
              type: 'string',
              pattern: '^[0-9]{8}$',
              example: '12345678',
              description: 'DNI del usuario (8 dígitos)'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Admin' },
            apellido: { type: 'string', example: 'Sistema' },
            dni: { type: 'string', example: '12345678' },
            rol: {
              type: 'string',
              enum: ['admin', 'cajero', 'mesero', 'cocinero', 'delivery'],
              example: 'admin'
            },
            email: { type: 'string', example: 'admin@polleriayacky.com' },
            telefono: { type: 'string', example: '902458936' },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },

        // ============================================
        // LOGIN CLIENTE (por email + password)
        // ============================================
        LoginClienteRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'cliente@test.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: '123456'
            }
          }
        },
        LoginClienteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            cliente: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                nombre: { type: 'string', example: 'Juan' },
                apellido: { type: 'string', example: 'Pérez' },
                dni: { type: 'string', example: '12345678' },
                email: { type: 'string', example: 'juan@test.com' },
                telefono: { type: 'string', example: '987654321' },
                direccion: { type: 'string', example: 'Av. Lima 123' },
                tipo_cliente: {
                  type: 'string',
                  enum: ['regular', 'frecuente', 'vip'],
                  example: 'regular'
                },
                puntos: { type: 'integer', example: 0 },
                activo: { type: 'boolean', example: true }
              }
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },

        // ============================================
        // REGISTRO CLIENTE
        // ============================================
        RegisterClienteRequest: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@test.com'
            },
            telefono: { type: 'string', example: '987654321' },
            direccion: { type: 'string', example: 'Av. Lima 123' },
            password: { type: 'string', minLength: 6, example: '123456' }
          }
        },

        // ============================================
        // MODELOS
        // ============================================
        Cliente: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            dni: { type: 'string', example: '12345678' },
            telefono: { type: 'string', example: '987654321' },
            email: { type: 'string', example: 'juan@test.com' },
            direccion: { type: 'string', example: 'Av. Lima 123' },
            tipo_cliente: {
              type: 'string',
              enum: ['regular', 'frecuente', 'vip'],
              example: 'regular'
            },
            puntos: { type: 'integer', example: 0 },
            activo: { type: 'boolean', example: true }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Perez' },
            dni: { type: 'string', pattern: '^[0-9]{8}$', example: '12345678' },
            email: { type: 'string', format: 'email', example: 'juan@email.com' },
            telefono: { type: 'string', example: '902458936' },
            rol: {
              type: 'string',
              enum: ['admin', 'cajero', 'mesero', 'cocinero', 'delivery'],
              example: 'mesero'
            },
            activo: { type: 'boolean', example: true }
          }
        },
        Producto: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            categoria_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: '1/4 de pollo' },
            precio: { type: 'number', format: 'decimal', example: 12.0 },
            descripcion: {
              type: 'string',
              example: 'Cuarto de pollo a la brasa con papas fritas'
            },
            stock: { type: 'integer', example: 50 },
            disponible: { type: 'boolean', example: true },
            agotado: { type: 'boolean', example: false }
          }
        },
        Pedido: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            mesa_id: { type: 'integer', example: 1, nullable: true },
            usuario_id: { type: 'integer', example: 1 },
            cliente_nombre: { type: 'string', example: 'Cliente 1' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  nombre: { type: 'string', example: '1/4 de pollo' },
                  cantidad: { type: 'integer', example: 2 },
                  precio: { type: 'number', example: 12.0 }
                }
              }
            },
            subtotal: { type: 'number', example: 24.0 },
            igv: { type: 'number', example: 4.32 },
            total: { type: 'number', example: 28.32 },
            estado: {
              type: 'string',
              enum: ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'],
              example: 'pendiente'
            },
            pagado: { type: 'boolean', example: false }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de sesiones' },
      { name: 'Usuarios', description: 'Gestión de usuarios del sistema' },
      { name: 'Productos', description: 'Gestión de productos y menú' },
      { name: 'Categorías', description: 'Gestión de categorías de productos' },
      { name: 'Pedidos', description: 'Gestión de pedidos' },
      { name: 'Ventas', description: 'Gestión de ventas y pagos' },
      { name: 'Clientes', description: 'Gestión de clientes' },
      { name: 'Mesas', description: 'Gestión de mesas' },
      { name: 'Configuración', description: 'Configuración del sistema' },
      { name: 'Reportes', description: 'Reportes y estadísticas' },
      { name: 'Health', description: 'Verificación del estado del sistema' }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};