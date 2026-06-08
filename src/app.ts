import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import v1 from './routes'
import { landingHtml } from './landing'
import { openapiSpec } from './openapi'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['x-api-key', 'Content-Type', 'Accept'],
  exposeHeaders: ['x-ratelimit-limit', 'x-ratelimit-remaining'],
}))

app.use('/v1/*', authMiddleware)
app.use('/v1/*', rateLimitMiddleware)

// Path-aware Cache-Control — runs after route handler via await next()
app.use('/v1/*', async (c, next) => {
  await next()
  if (c.req.method !== 'GET') return
  const path = c.req.path
  let maxAge = 60 // default: 1 min (dólar, crypto — precios en tiempo real)
  if      (path.includes('/inflacion'))  maxAge = 7200  // 2 h  — INDEC publica mensual
  else if (path.includes('/bcra'))       maxAge = 3600  // 1 h  — BCRA publica diario
  else if (path.includes('/historico'))  maxAge = 1800  // 30 m — datos históricos cambian poco
  else if (path.includes('/cedears'))    maxAge = 300   // 5 m  — BYMA intraday
  // Cache-Control para browsers; CDN-Cache-Control para el edge de Vercel
  c.header('Cache-Control',     `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`)
  c.header('CDN-Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`)
})

app.route('/v1', v1)

app.get('/', (c) => c.html(landingHtml))
app.get('/openapi.json', (c) => c.json(openapiSpec))

app.notFound((c) =>
  c.json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado. Ver / para la lista de endpoints.' },
    timestamp: new Date().toISOString(),
  }, 404)
)

app.onError((err, c) => {
  console.error('[error]', err)
  return c.json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    timestamp: new Date().toISOString(),
  }, 500)
})

export default app
