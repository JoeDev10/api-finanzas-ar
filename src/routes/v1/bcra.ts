import { Hono } from 'hono'
import { getBCRAVariables, getBCRAVariable, getReservas } from '../../services/bcra'

const bcra = new Hono()

bcra.get('/variables', async (c) => {
  const { variables, cached } = await getBCRAVariables()
  return c.json({
    success: true,
    data: variables,
    fuente: 'BCRA — Banco Central de la República Argentina',
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

bcra.get('/variables/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id)) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAM', message: 'El ID debe ser un número entero' },
      timestamp: new Date().toISOString(),
    }, 400)
  }
  const variable = await getBCRAVariable(id)
  if (!variable) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Variable BCRA ${id} no encontrada` },
      timestamp: new Date().toISOString(),
    }, 404)
  }
  return c.json({ success: true, data: variable, timestamp: new Date().toISOString() })
})

bcra.get('/reservas', async (c) => {
  const reservas = await getReservas()
  if (!reservas) {
    return c.json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No se pudo obtener reservas' },
      timestamp: new Date().toISOString(),
    }, 503)
  }
  return c.json({
    success: true,
    data: { nombre: 'Reservas Internacionales', ...reservas },
    fuente: 'BCRA',
    timestamp: new Date().toISOString(),
  })
})

export default bcra
