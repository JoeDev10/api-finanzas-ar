import { cache } from '../lib/cache'

const BLUELYTICS_URL = 'https://api.bluelytics.com.ar/v2/evolution.json'

export interface HistoricoItem {
  fecha: string
  compra: number | null
  venta: number | null
  tipo: string
}

const SOURCE_MAP: Record<string, string> = {
  'Blue': 'blue',
  'Oficial': 'oficial',
}

export async function getDollarHistorico(
  tipo: string,
  dias = 30
): Promise<{ data: HistoricoItem[]; cached: boolean }> {
  const limitedDias = Math.min(Math.max(1, dias), 365)
  const cacheKey = `historico:${tipo}:${limitedDias}`
  const hit = cache.get<HistoricoItem[]>(cacheKey)
  if (hit) return { data: hit, cached: true }

  // Bluelytics solo tiene Blue y Oficial
  const tiposBluelytics: Record<string, string> = {
    blue: 'Blue',
    oficial: 'Oficial',
  }

  if (!tiposBluelytics[tipo]) {
    return { data: [], cached: false }
  }

  try {
    const url = `${BLUELYTICS_URL}?days=${limitedDias}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`bluelytics status ${res.status}`)

    const raw: Array<{ date: string; source: string; value_buy: number; value_sell: number }> =
      await res.json()

    const sourceLabel = tiposBluelytics[tipo]
    const data: HistoricoItem[] = raw
      .filter(item => item.source === sourceLabel)
      .map(item => ({
        fecha: item.date,
        compra: item.value_buy,
        venta: item.value_sell,
        tipo: SOURCE_MAP[item.source] ?? item.source.toLowerCase(),
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)) // más reciente primero

    cache.set(cacheKey, data, 30 * 60 * 1_000) // 30 min
    return { data, cached: false }
  } catch (err) {
    console.error('[historico] error:', (err as Error).message)
    return { data: [], cached: false }
  }
}
