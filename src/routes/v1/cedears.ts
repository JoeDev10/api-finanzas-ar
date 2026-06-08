import { Hono } from 'hono'
import { getCEDEARs, getCEDEAR } from '../../services/cedears'

const cedears = new Hono()

cedears.get('/', async (c) => {
  const page  = Math.max(0, parseInt(c.req.query('page')  ?? '0'))
  const limit = Math.min(Math.max(1, parseInt(c.req.query('limit') ?? '50')), 200)

  const { data, total, cached } = await getCEDEARs(page, limit)
  return c.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      fuente: 'BYMA — Buenos Aires Stock Exchange',
      nota: 'Beta — los datos dependen de la disponibilidad de la API de BYMA',
    },
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

cedears.get('/:simbolo', async (c) => {
  const simbolo = c.req.param('simbolo').toUpperCase()
  const cedear = await getCEDEAR(simbolo)
  if (!cedear) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: `CEDEAR '${simbolo}' no encontrado` },
      timestamp: new Date().toISOString(),
    }, 404)
  }
  return c.json({ success: true, data: cedear, timestamp: new Date().toISOString() })
})

export default cedears
