import type { MiddlewareHandler } from 'hono'
import { CONFIG } from '../config'
import type { ApiKey } from '../types'

interface RLEntry { count: number; resetAt: number }
const store = new Map<string, RLEntry>()

function getLimits(tier?: string) {
  if (tier === 'enterprise') return CONFIG.RATE_LIMIT.ENTERPRISE
  if (tier === 'pro')        return CONFIG.RATE_LIMIT.PRO
  if (tier === 'free')       return CONFIG.RATE_LIMIT.FREE
  return CONFIG.RATE_LIMIT.ANONYMOUS
}

function allow(key: string, limits: { requests: number; windowMs: number }): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + limits.windowMs })
    return true
  }
  if (entry.count >= limits.requests) return false
  entry.count++
  return true
}

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.get('apiKey') as ApiKey | undefined
  const limits = getLimits(apiKey?.tier)

  const clientKey = apiKey
    ? `key:${apiKey.id}`
    : `ip:${c.req.header('x-forwarded-for')?.split(',')[0] ?? c.req.header('x-real-ip') ?? 'unknown'}`

  if (!allow(clientKey, limits)) {
    return c.json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Esperá antes de reintentar.',
      },
      timestamp: new Date().toISOString(),
    }, 429)
  }

  await next()
}

// Limpiar entradas vencidas cada minuto (solo fuera de serverless: en Vercel
// un timer activo mantiene vivo el event loop e impide liberar la respuesta).
if (!process.env.VERCEL) {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [k, e] of store.entries()) {
      if (now > e.resetAt) store.delete(k)
    }
  }, 60_000)
  timer.unref?.()
}
