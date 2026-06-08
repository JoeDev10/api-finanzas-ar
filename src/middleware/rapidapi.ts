import { createMiddleware } from 'hono/factory'
import { CONFIG } from '../config'

/**
 * RapidAPI Proxy Secret middleware
 *
 * RapidAPI forwarded requests carry three headers:
 *   X-RapidAPI-Proxy-Secret  — secret configured in the RapidAPI dashboard
 *   X-RapidAPI-Key           — the end-user's RapidAPI subscription key
 *   X-RapidAPI-Host          — our API host on RapidAPI
 *
 * When RAPIDAPI_PROXY_SECRET is set:
 *   - Requests WITHOUT the correct secret are rejected (403)
 *     unless they carry a valid ADMIN_API_KEY (for monitoring / Vercel previews)
 *   - Requests WITH the correct secret are tagged with context so the
 *     rate limiter can read the caller's RapidAPI plan
 *
 * When RAPIDAPI_PROXY_SECRET is NOT set (local dev / direct access):
 *   - Middleware is a no-op
 */
export const rapidapiMiddleware = createMiddleware(async (c, next) => {
  const secret = CONFIG.RAPIDAPI_PROXY_SECRET
  if (!secret) return next()  // not configured → skip

  const incomingSecret = c.req.header('x-rapidapi-proxy-secret')
  const adminKey       = c.req.header('x-api-key') ?? c.req.query('api_key')

  // Allow requests that carry the correct proxy secret
  if (incomingSecret === secret) {
    // Expose the RapidAPI user key to downstream middleware
    const rapidKey = c.req.header('x-rapidapi-key') ?? 'rapidapi-anonymous'
    c.set('rapidapi_key',  rapidKey)
    c.set('rapidapi_plan', c.req.header('x-rapidapi-subscription') ?? 'basic')
    return next()
  }

  // Allow our own admin key (monitoring, CI)
  if (adminKey && adminKey === CONFIG.ADMIN_API_KEY) {
    return next()
  }

  return c.json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Esta API solo acepta requests a través de RapidAPI. ' +
               'Suscribite en https://rapidapi.com/joedev10/api/api-finanzas-ar',
    },
    timestamp: new Date().toISOString(),
  }, 403)
})
