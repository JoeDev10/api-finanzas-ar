/**
 * Postman Collection v2.1 — API Finanzas AR
 * Served at GET /postman.json
 * Import directly from: https://api-finanzas-ar.vercel.app/postman.json
 */

const BASE = 'https://api-finanzas-ar.vercel.app'

export const postmanCollection = {
  info: {
    name: 'API Finanzas AR',
    description:
      'API REST de datos financieros para Argentina y LATAM.\n\n' +
      'Cobertura: Dólar (blue/oficial/MEP/CCL/tarjeta/mayorista/cripto), ' +
      'Inflación IPC (INDEC), Variables BCRA (reservas, tasas, UVA, BADLAR), ' +
      'CEDEARs BYMA, Criptomonedas y conversor ARS ↔ USD.\n\n' +
      'URL base: ' + BASE + '\n\n' +
      'Autenticación: opcional. Pasar `x-api-key` como header o `?api_key=` en query string.\n' +
      'Rate limit anónimo: 30 req/min.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    version: { major: 1, minor: 0, patch: 0 },
  },

  variable: [
    { key: 'base_url', value: BASE, type: 'string' },
    { key: 'api_key',  value: '',   type: 'string', description: 'Opcional — header x-api-key' },
  ],

  auth: {
    type: 'apikey',
    apikey: [
      { key: 'key',   value: 'x-api-key',    type: 'string' },
      { key: 'value', value: '{{api_key}}',   type: 'string' },
      { key: 'in',    value: 'header',        type: 'string' },
    ],
  },

  item: [
    // ─────────────────────────────────────────────────────────────────────
    // Status & Docs
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'Status & Docs',
      item: [
        req('GET Estado del servicio',    '/v1/status'),
        req('GET OpenAPI Spec (JSON)',    '/openapi.json'),
        req('GET Postman Collection',     '/postman.json'),
        req('GET Landing page (HTML)',    '/'),
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Dólar
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'Dólar',
      item: [
        req('GET Todas las cotizaciones',         '/v1/dolar'),
        req('GET Dólar Blue',                     '/v1/dolar/blue'),
        req('GET Dólar Oficial',                  '/v1/dolar/oficial'),
        req('GET Dólar MEP (Bolsa)',              '/v1/dolar/mep'),
        req('GET Dólar CCL (Contado con Liqui)',  '/v1/dolar/ccl'),
        req('GET Dólar Tarjeta',                  '/v1/dolar/tarjeta'),
        req('GET Dólar Mayorista',                '/v1/dolar/mayorista'),
        req('GET Dólar Cripto (USDT)',            '/v1/dolar/cripto'),
        {
          name: 'GET Histórico global (blue + oficial)',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/dolar/historico?dias=30',
              host: ['{{base_url}}'],
              path: ['v1', 'dolar', 'historico'],
              query: [
                { key: 'dias', value: '30', description: 'Días de historial (max 365, default 30)' },
              ],
            },
            description: 'Retorna el histórico de dólar blue y oficial juntos.',
          },
        },
        {
          name: 'GET Histórico por tipo (blue)',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/dolar/blue/historico?dias=30',
              host: ['{{base_url}}'],
              path: ['v1', 'dolar', 'blue', 'historico'],
              query: [
                { key: 'dias', value: '30', description: 'Días de historial (max 365, default 30)' },
              ],
            },
            description: 'Retorna el histórico de dólar blue. Tipos disponibles: blue, oficial.',
          },
        },
        {
          name: 'GET Histórico por tipo (oficial)',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/dolar/oficial/historico?dias=14',
              host: ['{{base_url}}'],
              path: ['v1', 'dolar', 'oficial', 'historico'],
              query: [
                { key: 'dias', value: '14', description: 'Días de historial (max 365)' },
              ],
            },
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Conversor
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'Conversor de monedas',
      item: [
        {
          name: 'GET Convertir USD → ARS (blue)',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/convertir?monto=100&de=usd&a=ars&tipo=blue',
              host: ['{{base_url}}'],
              path: ['v1', 'convertir'],
              query: [
                { key: 'monto', value: '100',  description: 'Monto a convertir' },
                { key: 'de',    value: 'usd',  description: 'Moneda de origen (usd | ars)' },
                { key: 'a',     value: 'ars',  description: 'Moneda de destino (usd | ars)' },
                { key: 'tipo',  value: 'blue', description: 'Tipo de cambio (blue | oficial | mep | ccl | tarjeta | mayorista | cripto). Opcional — default: blue' },
              ],
            },
            description: 'Convierte entre USD y ARS usando el tipo de cambio elegido.',
          },
        },
        {
          name: 'GET Convertir ARS → USD (oficial)',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/convertir?monto=50000&de=ars&a=usd&tipo=oficial',
              host: ['{{base_url}}'],
              path: ['v1', 'convertir'],
              query: [
                { key: 'monto', value: '50000',   description: 'Monto a convertir' },
                { key: 'de',    value: 'ars',      description: 'Moneda de origen' },
                { key: 'a',     value: 'usd',      description: 'Moneda de destino' },
                { key: 'tipo',  value: 'oficial',  description: 'Tipo de cambio' },
              ],
            },
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Inflación
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'Inflación (INDEC)',
      item: [
        req('GET Último dato IPC',       '/v1/inflacion'),
        {
          name: 'GET Histórico IPC',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/inflacion/historico?limit=24',
              host: ['{{base_url}}'],
              path: ['v1', 'inflacion', 'historico'],
              query: [
                { key: 'limit', value: '24', description: 'Cantidad de períodos a retornar (max 120, default 24)' },
              ],
            },
            description: 'Retorna el histórico de inflación IPC mensual del INDEC.',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // BCRA
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'BCRA',
      item: [
        req('GET Variables principales', '/v1/bcra/variables'),
        req('GET Reservas internacionales', '/v1/bcra/reservas'),
        {
          name: 'GET Variable por ID',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/bcra/variables/1',
              host: ['{{base_url}}'],
              path: ['v1', 'bcra', 'variables', '1'],
            },
            description: 'Retorna una variable BCRA por su ID numérico. Ej: 1=Reservas, 4=Base monetaria, 7=TNA Política monetaria.',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // CEDEARs
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'CEDEARs (BYMA)',
      item: [
        {
          name: 'GET Lista de CEDEARs',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/cedears?limit=20&page=1',
              host: ['{{base_url}}'],
              path: ['v1', 'cedears'],
              query: [
                { key: 'limit', value: '20', description: 'Cantidad por página (max 100, default 20)' },
                { key: 'page',  value: '1',  description: 'Página (default 1)' },
              ],
            },
            description: 'Lista paginada de CEDEARs de BYMA con precios y ratios.',
          },
        },
        {
          name: 'GET CEDEAR por símbolo',
          request: {
            method: 'GET',
            header: authHeader(),
            url: {
              raw: '{{base_url}}/v1/cedears/AAPL',
              host: ['{{base_url}}'],
              path: ['v1', 'cedears', 'AAPL'],
            },
            description: 'Datos de un CEDEAR específico por su símbolo (ej. AAPL, GOOGL, AMZN).',
          },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Crypto
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'Criptomonedas',
      item: [
        req('GET Precios en USD y ARS', '/v1/crypto'),
      ],
    },
  ],
}

// ─── helpers ───────────────────────────────────────────────────────────────

function authHeader() {
  return [
    { key: 'x-api-key', value: '{{api_key}}', type: 'text', description: 'API Key (opcional)' },
  ]
}

function req(name: string, path: string) {
  return {
    name,
    request: {
      method: 'GET',
      header: authHeader(),
      url: {
        raw: `{{base_url}}${path}`,
        host: ['{{base_url}}'],
        path: path.replace(/^\//, '').split('/'),
      },
    },
  }
}
