import { Hono } from 'hono'
import { getUltimaInflacion, getInflacion } from '../../services/inflacion'

const inflacion = new Hono()

inflacion.get('/', async (c) => {
  const ultima = await getUltimaInflacion()
  if (!ultima) {
    return c.json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No se pudo obtener datos de inflación' },
      timestamp: new Date().toISOString(),
    }, 503)
  }
  return c.json({
    success: true,
    data: ultima,
    fuente: 'INDEC — Índice de Precios al Consumidor (IPC)',
    timestamp: new Date().toISOString(),
  })
})

inflacion.get('/historico', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '24'), 120)
  const { data, cached } = await getInflacion(limit)
  return c.json({
    success: true,
    data,
    meta: { total: data.length, fuente: 'INDEC — IPC' },
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

export default inflacion
