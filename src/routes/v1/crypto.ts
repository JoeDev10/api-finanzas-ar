import { Hono } from 'hono'
import { getCryptoPrices } from '../../services/crypto'

const crypto = new Hono()

crypto.get('/', async (c) => {
  const { data, cached } = await getCryptoPrices()
  if (!data.length) {
    return c.json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No se pudo obtener precios de crypto' },
      timestamp: new Date().toISOString(),
    }, 503)
  }
  return c.json({
    success: true,
    data,
    fuente: 'CoinGecko',
    timestamp: new Date().toISOString(),
    cache: cached ? 'HIT' : 'MISS',
  })
})

export default crypto
