import { cache } from '../lib/cache'
import { CONFIG } from '../config'
import type { InflacionData } from '../types'

const INDEC_URL = 'https://apis.datos.gob.ar/series/api/series/'
const IPC_ID = '148.3_INIVELNAL_DICI_M_26'

export async function getInflacion(limit = 24): Promise<{ data: InflacionData[]; cached: boolean }> {
  const cacheKey = `inflacion:${limit}`
  const hit = cache.get<InflacionData[]>(cacheKey)
  if (hit) return { data: hit, cached: true }

  try {
    const fetchLimit = Math.max(limit + 12, 36)
    const url = new URL(INDEC_URL)
    url.searchParams.set('ids', IPC_ID)
    url.searchParams.set('limit', fetchLimit.toString())
    url.searchParams.set('sort', 'desc')
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`INDEC status ${res.status}`)

    const raw = await res.json()
    const sorted: Array<[string, number]> = [...raw.data].sort(
      (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0])
    )

    const result: InflacionData[] = sorted.map(([fecha, indice], i) => {
      const prevMes = i > 0 ? sorted[i - 1][1] : null
      const prevAnio = i >= 12 ? sorted[i - 12][1] : null
      return {
        periodo: fecha.substring(0, 7),
        indice,
        variacion_mensual: prevMes
          ? parseFloat(((indice - prevMes) / prevMes * 100).toFixed(2))
          : null,
        variacion_interanual: prevAnio
          ? parseFloat(((indice - prevAnio) / prevAnio * 100).toFixed(2))
          : null,
      }
    })

    const sliced = result.slice(-limit).reverse()
    cache.set(cacheKey, sliced, CONFIG.CACHE_TTL.INFLACION)
    return { data: sliced, cached: false }
  } catch (err) {
    console.error('[inflacion] INDEC error:', (err as Error).message)
    return { data: [], cached: false }
  }
}

export async function getUltimaInflacion(): Promise<InflacionData | null> {
  const { data } = await getInflacion(24)
  return data[0] ?? null
}
