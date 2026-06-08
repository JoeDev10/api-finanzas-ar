#!/usr/bin/env node
/**
 * Smoke test suite — ejecutar con: npm test
 * Prueba todos los endpoints contra la URL base configurada.
 *
 * Uso:
 *   npm test                          → contra producción
 *   BASE_URL=http://localhost:3001 npm test  → contra local
 */

const BASE = process.env.BASE_URL ?? 'https://api-finanzas-ar.vercel.app'

const cases = [
  // ── Status & docs
  { path: '/',              want: 200, label: 'Landing page (HTML)' },
  { path: '/openapi.json',  want: 200, label: 'OpenAPI spec' },
  { path: '/postman.json',  want: 200, label: 'Postman collection' },
  { path: '/v1/status',     want: 200, label: 'Status endpoint' },

  // ── Dólar
  { path: '/v1/dolar',                         want: 200, label: 'Dólar — todos' },
  { path: '/v1/dolar/blue',                    want: 200, label: 'Dólar — blue' },
  { path: '/v1/dolar/oficial',                 want: 200, label: 'Dólar — oficial' },
  { path: '/v1/dolar/mep',                     want: 200, label: 'Dólar — mep' },
  { path: '/v1/dolar/ccl',                     want: 200, label: 'Dólar — ccl' },
  { path: '/v1/dolar/tarjeta',                 want: 200, label: 'Dólar — tarjeta' },
  { path: '/v1/dolar/mayorista',               want: 200, label: 'Dólar — mayorista' },
  { path: '/v1/dolar/cripto',                  want: 200, label: 'Dólar — cripto' },
  { path: '/v1/dolar/historico',               want: 200, label: 'Histórico global' },
  { path: '/v1/dolar/historico?dias=7',        want: 200, label: 'Histórico global ?dias=7' },
  { path: '/v1/dolar/blue/historico',          want: 200, label: 'Histórico blue' },
  { path: '/v1/dolar/oficial/historico?dias=5',want: 200, label: 'Histórico oficial ?dias=5' },

  // ── Conversor
  { path: '/v1/convertir?monto=100&de=usd&a=ars',           want: 200, label: 'Convertir USD→ARS' },
  { path: '/v1/convertir?monto=50000&de=ars&a=usd',         want: 200, label: 'Convertir ARS→USD' },
  { path: '/v1/convertir?monto=100&de=usd&a=ars&tipo=blue', want: 200, label: 'Convertir ?tipo=blue' },
  { path: '/v1/convertir?monto=100&de=usd&a=ars&tipo=BLUE', want: 200, label: 'Convertir ?tipo=BLUE (case)' },
  { path: '/v1/convertir?monto=100&de=usd&a=usd',           want: 400, label: 'Convertir de=a (error)' },
  { path: '/v1/convertir?de=usd&a=ars',                     want: 400, label: 'Convertir sin monto (error)' },

  // ── Inflación
  { path: '/v1/inflacion',                  want: 200, label: 'Inflación — último' },
  { path: '/v1/inflacion/historico',        want: 200, label: 'Inflación — histórico' },
  { path: '/v1/inflacion/historico?limit=6',want: 200, label: 'Inflación — ?limit=6' },

  // ── BCRA
  { path: '/v1/bcra/variables',   want: 200, label: 'BCRA — variables' },
  { path: '/v1/bcra/reservas',    want: 200, label: 'BCRA — reservas' },

  // ── CEDEARs
  { path: '/v1/cedears',          want: 200, label: 'CEDEARs — lista' },
  { path: '/v1/cedears?limit=10', want: 200, label: 'CEDEARs — ?limit=10' },

  // ── Crypto
  { path: '/v1/crypto', want: 200, label: 'Crypto' },

  // ── Error cases
  { path: '/v1/dolar/invalido',          want: 400, label: 'Dólar tipo inválido → 400' },
  { path: '/v1/dolar/moose/historico',   want: 400, label: 'Histórico tipo inválido → 400' },
  { path: '/v1/ruta-que-no-existe',      want: 404, label: 'Ruta inexistente → 404' },
]

async function run() {
  console.log(`\n🔍 Smoke tests → ${BASE}\n`)

  let pass = 0, fail = 0
  const failures = []

  for (const { path, want, label } of cases) {
    try {
      const res = await fetch(`${BASE}${path}`)
      if (res.status === want) {
        console.log(`  ✓  ${String(res.status).padEnd(4)} ${label}`)
        pass++
      } else {
        const msg = `  ✗  ${res.status} (expected ${want})  ${label}`
        console.log(msg)
        failures.push(msg)
        fail++
      }
    } catch (err) {
      const msg = `  ✗  ERROR  ${label}: ${err.message}`
      console.log(msg)
      failures.push(msg)
      fail++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  Resultado: ${pass}/${pass + fail} tests ok`)

  if (failures.length) {
    console.log('\n  Fallos:')
    failures.forEach(f => console.log(f))
    process.exit(1)
  } else {
    console.log('  ✅ Todo ok\n')
  }
}

run()
