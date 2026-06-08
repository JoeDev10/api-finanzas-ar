import { Hono } from 'hono'
import { getDollarHistorico } from '../../services/historico'

const historico = new Hono()

const TIPOS_CON_HISTORICO = ['blue', 'oficial']

// GET /v1/dolar/historico  — blue + oficial juntos
historico.get('/historico', async (c) => {
  const dias = Math.min(parseInt(c.req.query('dias') ?? '30'), 365)

  const [
    { data: blueData,   cached: blueCached   },
    { data: oficialData, cached: oficialCached },
  ] = await Promise.all([
    getDollarHistorico('blue',   dias),
    getDollarHistorico('oficial', dias),
  ])

  return c.json({
    success: true,
    data: {
      blue:   blueData,
      oficial: oficialData,
    },
    meta: {
      dias_solicitados: dias,
      totales: {
        blue:   blueData.length,
        oficial: oficialData.length,
      },
      fuente: 'bluelytics.com.ar',
    },
    timestamp: new Date().toISOString(),
    cache: (blueCached && oficialCached) ? 'HIT' : 'MISS',
  })
})

// GET /v1/dolar/:tipo/historico
historico.get('/:tipo/historico', async (c) => {
  const tipo = c.req.param('tipo').toLowerCase()

  if (!TIPOS_CON_HISTORICO.includes(tipo)) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: `Histórico disponible para: ${TIPOS_CON_HISTORICO.join(', ')}. Otras cotizaciones próximamente.`,
      },
      timestamp: new Date().toISOString(),
    }, 400)
  }

  const dias = Math.min(parseInt(c.req.query('dias') ?? '30'), 365)
  const { data, cached } = await getDollarHistorico(tipo, dias)

  return c.json({
    success: true,
    data,
    meta: {
      tipo,
      dias_solicitados: dias,
      total: data.length,
      fuente: 'bluelytics.com.ar',
    },
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

export default historico
