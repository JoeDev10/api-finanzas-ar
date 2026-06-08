import type { MiddlewareHandler } from 'hono'
import { cache } from '../lib/cache'
import { getSupabase } from '../lib/supabase'
import { CONFIG } from '../config'
import type { ApiKey } from '../types'

async function resolveKey(key: string): Promise<ApiKey | null> {
  const cacheKey = `apikey:${key}`
  const hit = cache.get<ApiKey>(cacheKey)
  if (hit) return hit

  // Admin key via env (no Supabase needed)
  if (CONFIG.ADMIN_API_KEY && key === CONFIG.ADMIN_API_KEY) {
    const adminKey: ApiKey = {
      id: 'admin',
      key,
      name: 'Admin',
      email: '',
      tier: 'enterprise',
      daily_limit: 10_000_000,
      requests_today: 0,
      is_active: true,
    }
    cache.set(cacheKey, adminKey, CONFIG.CACHE_TTL.API_KEY)
    return adminKey
  }

  const sb = getSupabase()
  if (!sb) return null

  const { data, error } = await sb
    .from('api_keys')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  const apiKey: ApiKey = {
    id: data.id,
    key: data.key,
    name: data.name,
    email: data.email ?? '',
    tier: data.tier,
    daily_limit: data.daily_limit,
    requests_today: data.requests_today,
    is_active: data.is_active,
  }

  cache.set(cacheKey, apiKey, CONFIG.CACHE_TTL.API_KEY)

  // Increment usage counter asynchronously (fire-and-forget)
  sb.from('api_keys')
    .update({
      requests_today: data.requests_today + 1,
      requests_total: (data.requests_total ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {/* noop */})

  return apiKey
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const key = c.req.header('x-api-key') ?? c.req.query('api_key') ?? null

  if (key) {
    const apiKey = await resolveKey(key).catch(() => null)
    if (!apiKey) {
      return c.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'API key inválida o inactiva' },
        timestamp: new Date().toISOString(),
      }, 401)
    }
    c.set('apiKey', apiKey)
  }

  await next()
}
