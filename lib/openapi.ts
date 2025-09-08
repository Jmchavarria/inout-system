// /lib/openapi.ts
import type { OpenAPIV3 } from 'openapi-types';

const ErrorSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    details: { type: 'object', nullable: true },
  },
  required: ['error'],
};

const UserSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'user'] }, // ← ahora incluido (no requerido)
  },
  required: ['id', 'name', 'email'],
};

const UserUpdateSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    role: { type: 'string', enum: ['admin', 'user'] },
  },
  description: 'Campos opcionales. Requiere rol admin.',
};

const TransactionSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    concept: { type: 'string' },
    amount: { type: 'number' },
    date: { type: 'string', format: 'date-time' },
    user: { $ref: '#/components/schemas/User' },
  },
  required: ['id', 'concept', 'amount', 'date', 'user'],
};

export const openapiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Financial API',
    version: '1.0.0',
    description:
      'API de transacciones (ingresos/egresos). Autenticación vía sesión y control de roles (admin/user).',
  },
  servers: [
    // Lo ajustaremos dinámicamente en /api/docs.json con el host real
    { url: 'http://localhost:3000' },
  ],
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticación/identidad' },
    {
      name: 'Transactions',
      description: 'Lectura y creación de transacciones',
    },
  ],
  components: {
    securitySchemes: {
      // Ajusta el nombre de cookie si difiere en tu app
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' },
    },
    schemas: {
      Error: ErrorSchema,
      User: UserSchema,
      Transaction: TransactionSchema,
      UserUpdate: UserUpdateSchema,
    },
  },

  paths: {
    '/api/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener usuario y rol actual',
        description: 'Devuelve `{ userId, role }` del usuario autenticado.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'user'] },
                  },
                  required: ['userId', 'role'],
                },
                examples: {
                  ok: { value: { userId: 'u1', role: 'admin' } },
                },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios (solo admin)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'q',
            schema: { type: 'string' },
            required: false,
            description: 'Buscar por nombre o email',
          },
          {
            in: 'query',
            name: 'take',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            required: false,
          },
          {
            in: 'query',
            name: 'skip',
            schema: { type: 'integer', minimum: 0, default: 0 },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    skip: { type: 'integer' },
                    take: { type: 'integer' },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                  required: ['total', 'items'],
                },
                examples: {
                  ok: {
                    value: {
                      total: 1,
                      skip: 0,
                      take: 50,
                      items: [
                        {
                          id: 'u1',
                          name: 'Admin',
                          email: 'admin@example.com',
                          role: 'admin',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/users/{id}': {
      get: {
        tags: ['Users'], // opcional, "Auth" también vale
        summary: 'Obtener un usuario por id (solo admin)',
        description:
          'Acceso restringido a administradores. Los usuarios comunes deben usar `GET /api/me` para ver su propio perfil.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido (no admin)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'No encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },

      patch: {
        tags: ['Users'],
        summary: 'Editar usuario (solo admin)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdate' },
            },
          }, // ← solo name y role
        },
        responses: {
          '200': {
            description: 'Actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': {
            description: 'Body inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido (no admin)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'No encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/income': {
      get: {
        tags: ['Transactions'],
        summary: 'Listar transacciones',
        description:
          'Lista transacciones del usuario autenticado. **Admin** puede leer de otro usuario vía `?userId`.',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'userId',
            required: false,
            schema: { type: 'string' },
            description: 'Solo admin: listar transacciones de otro usuario',
          },
          {
            in: 'query',
            name: 'take',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 200, default: 200 },
            description: 'Cantidad máxima a devolver (por defecto 200)',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                  },
                  required: ['items'],
                },
                examples: {
                  ok: {
                    value: {
                      items: [
                        {
                          id: 'tx_1',
                          concept: 'Venta producto A',
                          amount: 850000,
                          date: '2025-09-07T00:00:00.000Z',
                          user: {
                            id: 'u1',
                            name: 'Juan Pérez',
                            email: 'juan@example.com',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Error interno',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    '/api/income/create': {
      post: {
        tags: ['Transactions'],
        summary: 'Crear transacción (solo admin)',
        description:
          'Crea una transacción. **Requiere rol admin**. `amount` puede ser positivo (ingreso) o negativo (egreso).',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  concept: { type: 'string', minLength: 1, maxLength: 200 },
                  amount: {
                    type: 'number',
                    description: 'Ingreso > 0, Egreso < 0',
                  },
                  date: {
                    oneOf: [
                      {
                        type: 'string',
                        format: 'date',
                        description: 'YYYY-MM-DD',
                      },
                      {
                        type: 'string',
                        format: 'date-time',
                        description: 'ISO 8601',
                      },
                    ],
                  },
                },
                required: ['concept', 'amount', 'date'],
              },
              examples: {
                ingreso: {
                  value: {
                    concept: 'Venta',
                    amount: 500000,
                    date: '2025-09-07',
                  },
                },
                egreso: {
                  value: {
                    concept: 'Compra insumos',
                    amount: -120000,
                    date: '2025-09-07',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Transaction' },
                examples: {
                  created: {
                    value: {
                      id: 'tx_abc',
                      concept: 'Venta',
                      amount: 500000,
                      date: '2025-09-07T00:00:00.000Z',
                      user: {
                        id: 'u1',
                        name: 'Admin',
                        email: 'admin@example.com',
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Body inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'No autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Prohibido (no admin)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '405': {
            description: 'Método no permitido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Error interno',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
};
