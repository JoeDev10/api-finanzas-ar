import { Hono } from 'hono'
import { getDollarQuotes, getDollarQuote } from '../../services/dolar'

const TIPOS = ['oficial', 'blue', 'mep', 'ccl', 'tarjeta', 'mayorista', 'cripto']

const dolar = new Hono()

dolar.get('/', async (c) => {
  const { quotes, cached } = await getDollarQuotes()
  if (!quotes.length) {
    return c.json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No se pudo obtener cotizaciones' },
      timestamp: new Date().toISOString(),
    }, 503)
  }
  return c.json({
    success: true,
    data: quotes,
    meta: { tipos_disponibles: quotes.map(q => q.tipo) },
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

// Regex ensures this route only fires for valid tipos — never intercepts /historico or /convertir
dolar.get('/:tipo{oficial|blue|mep|ccl|tarjeta|mayorista|cripto|ahorro}', async (c) => {
  const tipo = c.req.param('tipo').toLowerCase()
  if (!TIPOS.includes(tipo)) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_PARAM',
        message: `Tipo inválido. Opciones: ${TIPOS.join(', ')}`,
      },
      timestamp: new Date().toISOString(),
    }, 400)
  }
  const quote = await getDollarQuote(tipo)
  if (!quote) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Cotización '${tipo}' no disponible actualmente` },
      timestamp: new Date().toISOString(),
    }, 404)
  }
  return c.json({ success: true, data: quote, timestamp: new Date().toISOString() })
})

// Catch-all for invalid tipos — returns 400 with hint (never reached by /historico routes)
dolar.get('/:tipo', (c) =>
  c.json({
    success: false,
    error: {
      code: 'INVALID_PARAM',
      message: `Tipo inválido. Opciones: ${TIPOS.join(', ')}`,
    },
    timestamp: new Date().toISOString(),
  }, 400)
)

export default dolar
