import { Hono } from 'hono'
import { getDollarQuotes } from '../../services/dolar'

const convertir = new Hono()

// GET /v1/convertir?monto=1000&de=ars&a=usd
// GET /v1/convertir?monto=100&de=usd&a=ars
// GET /v1/convertir?monto=100&de=usd&a=ars&tipo=blue
convertir.get('/', async (c) => {
  const montoStr = c.req.query('monto')
  const de = (c.req.query('de') ?? 'usd').toLowerCase()
  const a  = (c.req.query('a')  ?? 'ars').toLowerCase()
  const tipoFiltro = c.req.query('tipo')?.toLowerCase()

  if (!montoStr || isNaN(parseFloat(montoStr))) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAM', message: 'El parámetro ?monto=N es requerido y debe ser numérico.' },
      timestamp: new Date().toISOString(),
    }, 400)
  }

  const monto = parseFloat(montoStr)

  if ((de !== 'usd' && de !== 'ars') || (a !== 'usd' && a !== 'ars')) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAM', message: 'Los parámetros ?de= y ?a= aceptan: usd, ars' },
      timestamp: new Date().toISOString(),
    }, 400)
  }

  if (de === a) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAM', message: '?de y ?a no pueden ser iguales.' },
      timestamp: new Date().toISOString(),
    }, 400)
  }

  const { quotes } = await getDollarQuotes()

  if (!quotes.length) {
    return c.json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No se pudo obtener cotizaciones.' },
      timestamp: new Date().toISOString(),
    }, 503)
  }

  // Filtrar por tipo si se especifica
  const quotesAUsar = tipoFiltro
    ? quotes.filter(q => q.tipo === tipoFiltro)
    : quotes

  if (tipoFiltro && !quotesAUsar.length) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Tipo '${tipoFiltro}' no encontrado.` },
      timestamp: new Date().toISOString(),
    }, 404)
  }

  const round = (n: number) => parseFloat(n.toFixed(2))

  const conversiones: Record<string, {
    tipo: string
    usando_compra: number | null
    usando_venta: number | null
    fuente: string
  }> = {}

  for (const q of quotesAUsar) {
    if (de === 'usd' && a === 'ars') {
      // USD → ARS: multiplicamos por venta (precio al que el mercado vende ARS por USD)
      conversiones[q.tipo] = {
        tipo: q.tipo,
        usando_compra: q.compra !== null ? round(monto * q.compra) : null,
        usando_venta:  q.venta  !== null ? round(monto * q.venta)  : null,
        fuente: q.fuente,
      }
    } else {
      // ARS → USD: dividimos por compra (precio al que el mercado compra USD)
      conversiones[q.tipo] = {
        tipo: q.tipo,
        usando_compra: q.compra !== null ? round(monto / q.compra) : null,
        usando_venta:  q.venta  !== null ? round(monto / q.venta)  : null,
        fuente: q.fuente,
      }
    }
  }

  return c.json({
    success: true,
    data: {
      monto,
      de: de.toUpperCase(),
      a: a.toUpperCase(),
      conversiones,
    },
    timestamp: new Date().toISOString(),
  })
})

export default convertir
