/** OpenAPI 3.0.3 spec — served at GET /openapi.json */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Finanzas AR',
    version: '1.0.0',
    description:
      'API REST de datos financieros para Argentina. ' +
      'Dólar (blue, MEP, CCL, oficial, tarjeta, mayorista, cripto), ' +
      'inflación IPC (INDEC), variables del BCRA, CEDEARs (BYMA) y precios de criptomonedas.',
    contact: { url: 'https://api-finanzas-ar.vercel.app' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'https://api-finanzas-ar.vercel.app', description: 'Producción' },
  ],
  tags: [
    { name: 'Dólar',     description: 'Cotizaciones y tipos de cambio' },
    { name: 'Inflación', description: 'IPC INDEC' },
    { name: 'BCRA',      description: 'Banco Central de la República Argentina' },
    { name: 'CEDEARs',   description: 'Certificados de Depósito Argentinos (BYMA)' },
    { name: 'Crypto',    description: 'Criptomonedas (CoinGecko)' },
    { name: 'Utilidades', description: 'Conversor y estado del servicio' },
  ],

  components: {
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Clave de API opcional. Sin clave: 30 req/min.',
      },
      ApiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
        description: 'Alternativa al header x-api-key.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code:    { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Recurso no encontrado' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      DolarQuote: {
        type: 'object',
        properties: {
          tipo:       { type: 'string', example: 'blue' },
          nombre:     { type: 'string', example: 'Blue' },
          compra:     { type: 'number', nullable: true, example: 1415 },
          venta:      { type: 'number', nullable: true, example: 1435 },
          spread:     { type: 'number', nullable: true, example: 1.41 },
          variacion:  { type: 'number', nullable: true, example: 0.5 },
          actualizado:{ type: 'string', format: 'date-time' },
          fuente:     { type: 'string', example: 'dolarapi.com' },
        },
      },
      HistoricoItem: {
        type: 'object',
        properties: {
          fecha:  { type: 'string', format: 'date', example: '2026-06-08' },
          compra: { type: 'number', nullable: true, example: 1415 },
          venta:  { type: 'number', nullable: true, example: 1435 },
          tipo:   { type: 'string', example: 'blue' },
        },
      },
      InflacionItem: {
        type: 'object',
        properties: {
          fecha:                 { type: 'string', example: '2024-04' },
          variacion_mensual:     { type: 'number', example: 8.8 },
          variacion_interanual:  { type: 'number', example: 289.4 },
          indice:                { type: 'number', example: 2384.2 },
        },
      },
      BCRAVariable: {
        type: 'object',
        properties: {
          id:     { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Reservas Internacionales' },
          valor:  { type: 'number', example: 28500000000 },
          fecha:  { type: 'string', format: 'date' },
          unidad: { type: 'string', example: 'USD' },
          fuente: { type: 'string', example: 'apis.datos.gob.ar' },
        },
      },
      Cedear: {
        type: 'object',
        properties: {
          simbolo:          { type: 'string', example: 'AAPL' },
          descripcion:      { type: 'string', example: 'Apple Inc.' },
          precio_cierre:    { type: 'number', example: 42750 },
          precio_anterior:  { type: 'number', example: 42210 },
          variacion:        { type: 'number', nullable: true, example: 1.28 },
          volumen:          { type: 'number', nullable: true },
          moneda:           { type: 'string', example: 'ARS' },
        },
      },
      CryptoItem: {
        type: 'object',
        properties: {
          id:            { type: 'string', example: 'bitcoin' },
          symbol:        { type: 'string', example: 'BTC' },
          name:          { type: 'string', example: 'Bitcoin' },
          precio_usd:    { type: 'number', example: 68420 },
          precio_ars:    { type: 'number', example: 94219600 },
          variacion_24h: { type: 'number', example: 2.14 },
          market_cap_usd:{ type: 'number', example: 1348000000000 },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Clave de API inválida',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Rate limit excedido',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Parámetro inválido',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
      ServiceUnavailable: {
        description: 'Fuente de datos no disponible',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } },
      },
    },
    parameters: {
      Dias: {
        name: 'dias',
        in: 'query',
        description: 'Cantidad de días de histórico (máx 365, default 30)',
        schema: { type: 'integer', minimum: 1, maximum: 365, default: 30 },
      },
    },
  },

  security: [{ ApiKeyHeader: [] }, { ApiKeyQuery: [] }],

  paths: {
    '/v1/status': {
      get: {
        tags: ['Utilidades'],
        summary: 'Estado del servicio',
        description: 'Devuelve el estado de la API, uptime y lista de endpoints disponibles.',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        status:         { type: 'string', example: 'online' },
                        version:        { type: 'string', example: '1.0.0' },
                        uptime_seconds: { type: 'integer' },
                        environment:    { type: 'string', example: 'production' },
                        endpoints:      { type: 'object', additionalProperties: { type: 'string' } },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/v1/dolar': {
      get: {
        tags: ['Dólar'],
        summary: 'Todas las cotizaciones',
        description: 'Devuelve todos los tipos de dólar disponibles: oficial, blue, MEP, CCL, tarjeta, mayorista y cripto.',
        responses: {
          '200': {
            description: 'Lista de cotizaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/DolarQuote' } },
                    meta: {
                      type: 'object',
                      properties: { tipos_disponibles: { type: 'array', items: { type: 'string' } } },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    cache: { type: 'string', enum: ['HIT', 'MISS'] },
                  },
                },
              },
            },
          },
          '503': { '$ref': '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/v1/dolar/{tipo}': {
      get: {
        tags: ['Dólar'],
        summary: 'Cotización por tipo',
        parameters: [
          {
            name: 'tipo',
            in: 'path',
            required: true,
            description: 'Tipo de dólar',
            schema: {
              type: 'string',
              enum: ['oficial', 'blue', 'mep', 'ccl', 'tarjeta', 'mayorista', 'cripto', 'ahorro'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Cotización',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { '$ref': '#/components/schemas/DolarQuote' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '404': { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/v1/dolar/historico': {
      get: {
        tags: ['Dólar'],
        summary: 'Histórico global (blue + oficial)',
        description: 'Devuelve el histórico de blue y oficial juntos en una sola llamada.',
        parameters: [{ '$ref': '#/components/parameters/Dias' }],
        responses: {
          '200': {
            description: 'Histórico blue y oficial',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        blue:   { type: 'array', items: { '$ref': '#/components/schemas/HistoricoItem' } },
                        oficial:{ type: 'array', items: { '$ref': '#/components/schemas/HistoricoItem' } },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        dias_solicitados: { type: 'integer' },
                        totales: {
                          type: 'object',
                          properties: {
                            blue:   { type: 'integer' },
                            oficial:{ type: 'integer' },
                          },
                        },
                        fuente: { type: 'string' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    cache: { type: 'string', enum: ['HIT', 'MISS'] },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/v1/dolar/{tipo}/historico': {
      get: {
        tags: ['Dólar'],
        summary: 'Histórico por tipo',
        description: 'Serie histórica para un tipo de dólar. Disponible para `blue` y `oficial` (fuente: bluelytics.com.ar).',
        parameters: [
          {
            name: 'tipo',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['blue', 'oficial'] },
          },
          { '$ref': '#/components/parameters/Dias' },
        ],
        responses: {
          '200': {
            description: 'Serie histórica',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/HistoricoItem' } },
                    meta: {
                      type: 'object',
                      properties: {
                        tipo:             { type: 'string' },
                        dias_solicitados: { type: 'integer' },
                        total:            { type: 'integer' },
                        fuente:           { type: 'string' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    cache: { type: 'string', enum: ['HIT', 'MISS'] },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
        },
      },
    },

    '/v1/convertir': {
      get: {
        tags: ['Utilidades'],
        summary: 'Conversor ARS ↔ USD',
        description:
          'Convierte entre ARS y USD usando todos los tipos de cambio disponibles. ' +
          'Opcionalmente filtrá con `?tipo=` para obtener solo un tipo.',
        parameters: [
          {
            name: 'monto',
            in: 'query',
            required: true,
            description: 'Monto a convertir',
            schema: { type: 'number', example: 1000 },
          },
          {
            name: 'de',
            in: 'query',
            required: true,
            description: 'Moneda origen',
            schema: { type: 'string', enum: ['ars', 'usd', 'ARS', 'USD'] },
          },
          {
            name: 'a',
            in: 'query',
            required: true,
            description: 'Moneda destino',
            schema: { type: 'string', enum: ['ars', 'usd', 'ARS', 'USD'] },
          },
          {
            name: 'tipo',
            in: 'query',
            required: false,
            description: 'Filtrar por tipo de cambio (blue, oficial, mep, etc.)',
            schema: { type: 'string', example: 'blue' },
          },
        ],
        responses: {
          '200': {
            description: 'Resultado de la conversión',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    monto: 1000,
                    de: 'USD',
                    a: 'ARS',
                    conversiones: {
                      blue: { tipo: 'blue', usando_compra: 1415000, usando_venta: 1435000, fuente: 'dolarapi.com' },
                    },
                  },
                  timestamp: '2026-06-08T20:00:00.000Z',
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '404': { '$ref': '#/components/responses/NotFound' },
          '503': { '$ref': '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/v1/inflacion': {
      get: {
        tags: ['Inflación'],
        summary: 'Último dato de inflación',
        description: 'Devuelve el dato más reciente del IPC (Índice de Precios al Consumidor) publicado por INDEC.',
        responses: {
          '200': {
            description: 'Dato de inflación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { '$ref': '#/components/schemas/InflacionItem' },
                    fuente: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '503': { '$ref': '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/v1/inflacion/historico': {
      get: {
        tags: ['Inflación'],
        summary: 'Histórico IPC',
        description: 'Serie histórica del IPC INDEC. Incluye variación mensual e interanual para cada período.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Cantidad de períodos (máx 120, default 24)',
            schema: { type: 'integer', minimum: 1, maximum: 120, default: 24 },
          },
        ],
        responses: {
          '200': {
            description: 'Serie histórica IPC',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/InflacionItem' } },
                    meta: {
                      type: 'object',
                      properties: { total: { type: 'integer' }, fuente: { type: 'string' } },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                    cache: { type: 'string', enum: ['HIT', 'MISS'] },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/v1/bcra/variables': {
      get: {
        tags: ['BCRA'],
        summary: 'Variables del BCRA',
        description: 'Reservas internacionales, base monetaria, tasa de política monetaria, BADLAR privada y UVA.',
        responses: {
          '200': {
            description: 'Variables BCRA',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        reservas:       { '$ref': '#/components/schemas/BCRAVariable' },
                        base_monetaria: { '$ref': '#/components/schemas/BCRAVariable' },
                        tasa_politica:  { '$ref': '#/components/schemas/BCRAVariable' },
                        badlar_privada: { '$ref': '#/components/schemas/BCRAVariable' },
                        uva:            { '$ref': '#/components/schemas/BCRAVariable' },
                      },
                    },
                    fuente: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/v1/bcra/variables/{id}': {
      get: {
        tags: ['BCRA'],
        summary: 'Variable BCRA por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID numérico de la variable BCRA',
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'Variable BCRA',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { '$ref': '#/components/schemas/BCRAVariable' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { '$ref': '#/components/responses/BadRequest' },
          '404': { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/v1/bcra/reservas': {
      get: {
        tags: ['BCRA'],
        summary: 'Reservas internacionales',
        description: 'Dato más reciente de reservas internacionales del BCRA en USD.',
        responses: {
          '200': {
            description: 'Reservas BCRA',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { '$ref': '#/components/schemas/BCRAVariable' },
                    fuente: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '503': { '$ref': '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/v1/cedears': {
      get: {
        tags: ['CEDEARs'],
        summary: 'Lista de CEDEARs',
        description: 'CEDEARs disponibles en BYMA. Los datos dependen de la disponibilidad de la API de BYMA (horario bursátil).',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Número de página (default 0)',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Resultados por página (máx 200, default 50)',
            schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de CEDEARs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/Cedear' } },
                    meta: {
                      type: 'object',
                      properties: {
                        page:   { type: 'integer' },
                        limit:  { type: 'integer' },
                        total:  { type: 'integer' },
                        fuente: { type: 'string' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/v1/cedears/{simbolo}': {
      get: {
        tags: ['CEDEARs'],
        summary: 'CEDEAR por símbolo',
        parameters: [
          {
            name: 'simbolo',
            in: 'path',
            required: true,
            description: 'Símbolo bursátil del CEDEAR (ej: AAPL, MSFT, GOOGL)',
            schema: { type: 'string', example: 'AAPL' },
          },
        ],
        responses: {
          '200': {
            description: 'CEDEAR encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { '$ref': '#/components/schemas/Cedear' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '404': { '$ref': '#/components/responses/NotFound' },
        },
      },
    },

    '/v1/crypto': {
      get: {
        tags: ['Crypto'],
        summary: 'Precios de criptomonedas',
        description:
          'Precios en USD y ARS de BTC, ETH, USDT, USDC, BNB, SOL, XRP y DAI. ' +
          'Fuente: CoinGecko. El precio en ARS se calcula usando el tipo de cambio CCL.',
        responses: {
          '200': {
            description: 'Lista de criptomonedas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { '$ref': '#/components/schemas/CryptoItem' } },
                    timestamp: { type: 'string', format: 'date-time' },
                    cache: { type: 'string', enum: ['HIT', 'MISS'] },
                  },
                },
              },
            },
          },
          '503': { '$ref': '#/components/responses/ServiceUnavailable' },
        },
      },
    },
  },
} as const
