import { config } from 'dotenv'

config()

export const CONFIG = {
  PORT: parseInt(process.env.PORT ?? '3000'),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY ?? '',
  RAPIDAPI_PROXY_SECRET: process.env.RAPIDAPI_PROXY_SECRET ?? '',

  RATE_LIMIT: {
    ANONYMOUS:  { requests: 30,     windowMs: 60_000 },
    FREE:       { requests: 200,    windowMs: 60_000 },
    PRO:        { requests: 1_000,  windowMs: 60_000 },
    ENTERPRISE: { requests: 10_000, windowMs: 60_000 },
  },

  CACHE_TTL: {
    DOLAR:    5  * 60 * 1_000,
    BCRA:     60 * 60 * 1_000,
    INFLACION: 6 * 60 * 60 * 1_000,
    CEDEARS:  15 * 60 * 1_000,
    CRYPTO:   5  * 60 * 1_000,
    API_KEY:  60 * 1_000,
  },
}
