import { Hono } from 'hono'
import { CONFIG } from '../../config'

const status = new Hono()
const startedAt = Date.now()

status.get('/', (c) =>
  c.json({
    success: true,
    data: {
      status: 'online',
      version: '1.0.0',
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1_000),
      environment: CONFIG.NODE_ENV,
      endpoints: {
        'GET /v1/status':                  'Estado del servicio',
        'GET /v1/dolar':                   'Todas las cotizaciones del dólar',
        'GET /v1/dolar/:tipo':             'Cotización por tipo (oficial|blue|mep|ccl|tarjeta|mayorista|cripto)',
        'GET /v1/dolar/historico':         'Histórico global blue + oficial — ?dias=N (max 365)',
        'GET /v1/dolar/:tipo/historico':   'Histórico por tipo — ?dias=N (max 365). Tipos: blue, oficial',
        'GET /v1/convertir':               'Conversor ARS ↔ USD — ?monto=&de=&a=&tipo= (tipo opcional)',
        'GET /v1/inflacion':               'Último dato de inflación (IPC INDEC)',
        'GET /v1/inflacion/historico':     'Histórico IPC — ?limit=N (max 120)',
        'GET /v1/bcra/variables':          'Variables BCRA (reservas, tasas, UVA)',
        'GET /v1/bcra/variables/:id':      'Variable BCRA por ID',
        'GET /v1/bcra/reservas':           'Reservas internacionales BCRA',
        'GET /v1/cedears':                 'CEDEARs BYMA — ?page=N&limit=N',
        'GET /v1/cedears/:simbolo':        'CEDEAR por símbolo',
        'GET /v1/crypto':                  'Precios de criptomonedas (USD y ARS)',
      },
    },
    timestamp: new Date().toISOString(),
  })
)

export default status
