# API Finanzas AR 🇦🇷

API de datos financieros de Argentina y LATAM. Dólar (todas las cotizaciones), inflación (IPC INDEC), variables del BCRA, CEDEARs (BYMA) y criptomonedas — en un solo lugar, con caché, multi-fuente y fallback automático.

## ¿Por qué?

Las APIs existentes cubren poco o se caen seguido. Esta unifica las fuentes confiables, agrega histórico, caché en memoria y rate limiting por tier. Pensada para devs que construyen dashboards fintech, bots de trading y apps de ahorro.

## Stack

- **[Hono](https://hono.dev)** + Node.js — framework web rápido y liviano
- **TypeScript** estricto
- **Supabase** (opcional) — API keys e histórico
- **node-cron** — refresco automático de datos en background
- **Caché en memoria** con TTL por tipo de dato

## Arranque rápido

```bash
npm install
cp .env.example .env   # ajustá el puerto si 3000 está ocupado
npm run dev
```

El servidor pre-carga el caché al arrancar. Probá:

```bash
curl http://localhost:3000/v1/dolar
```

## Endpoints

Base URL: `/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/status` | Estado del servicio y lista de endpoints |
| GET | `/dolar` | Todas las cotizaciones del dólar |
| GET | `/dolar/:tipo` | `oficial` · `blue` · `mep` · `ccl` · `tarjeta` · `mayorista` · `cripto` |
| GET | `/inflacion` | Último dato de inflación (IPC INDEC) |
| GET | `/inflacion/historico?limit=N` | Histórico IPC (máx. 120 meses) |
| GET | `/bcra/variables` | Reservas, base monetaria, tasa de política, BADLAR, UVA |
| GET | `/bcra/variables/:id` | Variable BCRA por ID |
| GET | `/bcra/reservas` | Reservas internacionales |
| GET | `/cedears?page=N&limit=N` | CEDEARs de BYMA |
| GET | `/cedears/:simbolo` | CEDEAR por símbolo (ej. `AAPL`) |
| GET | `/crypto` | Precios crypto en USD y ARS |

### Ejemplo de respuesta

```jsonc
// GET /v1/dolar/blue
{
  "success": true,
  "data": {
    "tipo": "blue",
    "nombre": "Blue",
    "compra": 1415,
    "venta": 1435,
    "spread": 1.41,
    "variacion": null,
    "actualizado": "2026-06-06T17:57:00.000Z",
    "fuente": "dolarapi.com"
  },
  "timestamp": "2026-06-07T12:00:00.000Z"
}
```

Todas las respuestas siguen el formato `{ success, data, timestamp }` (o `{ success: false, error }` en caso de fallo), e incluyen `cache: "HIT" | "MISS"` cuando corresponde.

## Autenticación (opcional)

Sin clave funcionás con el tier anónimo (30 req/min). Con API key obtenés más límite:

```bash
curl http://localhost:3000/v1/dolar -H "x-api-key: TU_CLAVE"
# o
curl "http://localhost:3000/v1/dolar?api_key=TU_CLAVE"
```

| Tier | Límite |
|------|--------|
| Anónimo | 30 req/min |
| Free | 200 req/min |
| Pro | 1.000 req/min |
| Enterprise | 10.000 req/min |

Para usar API keys configurá Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_KEY`) y aplicá la migración `supabase/migrations/001_initial.sql`. También podés definir una `ADMIN_API_KEY` por env sin necesidad de base de datos.

## Fuentes de datos

| Dato | Fuente primaria | Fallback |
|------|-----------------|----------|
| Dólar | dolarapi.com | bluelytics.com.ar |
| Inflación | INDEC vía apis.datos.gob.ar | — |
| BCRA | apis.datos.gob.ar (series) | — |
| CEDEARs | BYMA Open Data | — |
| Crypto | CoinGecko | — |

> **Nota:** la API v2 de estadísticas del BCRA fue deprecada (devuelve 410). Las variables monetarias se obtienen ahora de `apis.datos.gob.ar`, que publica las mismas series oficiales.

## Cache (TTL)

| Dato | TTL |
|------|-----|
| Dólar | 5 min |
| Crypto | 5 min |
| CEDEARs | 15 min |
| BCRA | 1 h |
| Inflación | 6 h |

El scheduler refresca el dólar y crypto cada 5 min, BCRA cada hora e inflación una vez al día.

## Producción

```bash
npm run build
npm start
```

## Roadmap

- [ ] Webhooks de alertas (ej. "avisame cuando el blue supere X")
- [ ] Persistir histórico en Supabase para series largas
- [ ] Endpoint de conversión (`/convertir?de=usd&a=ars&monto=100`)
- [ ] Billing con Stripe + portal de API keys
- [ ] SLA / status page público

## Licencia

MIT
