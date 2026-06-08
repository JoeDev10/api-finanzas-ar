import './config'
import { serve } from '@hono/node-server'
import app from './app'
import { CONFIG } from './config'
import { initScheduler } from './lib/scheduler'

initScheduler()

serve({ fetch: app.fetch, port: CONFIG.PORT }, (info) => {
  console.log(`
╔═══════════════════════════════════════════════╗
║          API Finanzas AR  v1.0.0              ║
╚═══════════════════════════════════════════════╝
  Puerto   : ${info.port}
  Entorno  : ${CONFIG.NODE_ENV}
  Supabase : ${CONFIG.SUPABASE_URL ? 'configurado' : 'no configurado (modo libre)'}

  Endpoints
  ─────────────────────────────────────────────
  GET /v1/status
  GET /v1/dolar           → todas las cotizaciones
  GET /v1/dolar/:tipo     → oficial | blue | mep | ccl | tarjeta | mayorista | cripto
  GET /v1/inflacion       → último IPC
  GET /v1/inflacion/historico
  GET /v1/bcra/variables
  GET /v1/bcra/reservas
  GET /v1/cedears
  GET /v1/crypto
`)
})
