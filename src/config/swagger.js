// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.SWAGGER_TITLE || 'Polleria Yacky API',
      description: process.env.SWAGGER_DESCRIPTION || 'API para el sistema de gestión de Polleria Yacky',
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
        // Respuesta de éxito
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            },
            data: {
              type: 'object'
            }
          }
        },
        // Respuesta de error
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error al procesar la solicitud'
            },
            details: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['El campo nombre es requerido']
            }
          }
        },
        // Login
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
            success: {
              type: 'boolean',
              example: true
            },
            id: {
              type: 'integer',
              example: 1
            },
            nombre: {
              type: 'string',
              example: 'Admin'
            },
            apellido: {
              type: 'string',
              example: 'Sistema'
            },
            dni: {
              type: 'string',
              example: '12345678'
            },
            rol: {
              type: 'string',
              enum: ['admin', 'cajero', 'mesero', 'cocinero', 'delivery'],
              example: 'admin'
            },
            email: {
              type: 'string',
              example: 'admin@polleriayacky.com'
            },
            telefono: {
              type: 'string',
              example: '902458936'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        // Usuario
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            nombre: {
              type: 'string',
              example: 'Juan'
            },
            apellido: {
              type: 'string',
              example: 'Perez'
            },
            dni: {
              type: 'string',
              pattern: '^[0-9]{8}$',
              example: '12345678'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@email.com'
            },
            telefono: {
              type: 'string',
              pattern: '^[0-9]{9}$',
              example: '902458936'
            },
            rol: {
              type: 'string',
              enum: ['admin', 'cajero', 'mesero', 'cocinero', 'delivery'],
              example: 'mesero'
            },
            activo: {
              type: 'boolean',
              example: true
            }
          }
        },
        // Producto
        Producto: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            categoria_id: {
              type: 'integer',
              example: 1
            },
            nombre: {
              type: 'string',
              example: '1/4 de pollo'
            },
            precio: {
              type: 'number',
              format: 'decimal',
              example: 12.00
            },
            descripcion: {
              type: 'string',
              example: 'Cuarto de pollo a la brasa con papas fritas'
            },
            stock: {
              type: 'integer',
              example: 50
            },
            disponible: {
              type: 'boolean',
              example: true
            },
            agotado: {
              type: 'boolean',
              example: false
            }
          }
        },
        // Pedido
        Pedido: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            mesa_id: {
              type: 'integer',
              example: 1,
              nullable: true
            },
            usuario_id: {
              type: 'integer',
              example: 1
            },
            cliente_nombre: {
              type: 'string',
              example: 'Cliente 1'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    example: 1
                  },
                  nombre: {
                    type: 'string',
                    example: '1/4 de pollo'
                  },
                  cantidad: {
                    type: 'integer',
                    example: 2
                  },
                  precio: {
                    type: 'number',
                    example: 12.00
                  }
                }
              }
            },
            subtotal: {
              type: 'number',
              example: 24.00
            },
            igv: {
              type: 'number',
              example: 4.32
            },
            total: {
              type: 'number',
              example: 28.32
            },
            estado: {
              type: 'string',
              enum: ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'],
              example: 'pendiente'
            },
            pagado: {
              type: 'boolean',
              example: false
            }
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
      {
        name: 'Auth',
        description: 'Autenticación y gestión de sesiones'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      },
      {
        name: 'Productos',
        description: 'Gestión de productos y menú'
      },
      {
        name: 'Categorías',
        description: 'Gestión de categorías de productos'
      },
      {
        name: 'Pedidos',
        description: 'Gestión de pedidos'
      },
      {
        name: 'Ventas',
        description: 'Gestión de ventas y pagos'
      },
      {
        name: 'Clientes',
        description: 'Gestión de clientes'
      },
      {
        name: 'Mesas',
        description: 'Gestión de mesas'
      },
      {
        name: 'Configuración',
        description: 'Configuración del sistema'
      },
      {
        name: 'Reportes',
        description: 'Reportes y estadísticas'
      },
      {
        name: 'Health',
        description: 'Verificación del estado del sistema'
      }
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