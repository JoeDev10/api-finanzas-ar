import { cache } from '../lib/cache'
import { CONFIG } from '../config'

const BYMA_URL = 'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/cedears'

export interface CEDEAR {
  simbolo: string
  descripcion: string
  ultimoPrecio: number | null
  cierreAnterior: number | null
  variacion: number | null
  apertura: number | null
  maximo: number | null
  minimo: number | null
  volumen: number | null
  moneda: string
}

interface BymaItem {
  symbol: string
  description?: string
  securityDesc?: string
  settlementPrice?: number
  closingPrice?: number
  previousClosingPrice?: number
  previousSettlementPrice?: number
  openingPrice?: number
  tradingHighPrice?: number
  tradingLowPrice?: number
  volume?: number
  volumeAmount?: number
  denominationCcy?: string
}

function nz(n: number | undefined): number | null {
  return n && n !== 0 ? n : null
}

function mapItem(item: BymaItem): CEDEAR {
  const precio = nz(item.settlementPrice) ?? nz(item.closingPrice)
  const cierreAnt = nz(item.previousClosingPrice) ?? nz(item.previousSettlementPrice)
  const variacion = precio && cierreAnt
    ? parseFloat(((precio - cierreAnt) / cierreAnt * 100).toFixed(2))
    : null

  return {
    simbolo: item.symbol ?? '',
    descripcion: item.description || item.securityDesc || '',
    ultimoPrecio: precio,
    cierreAnterior: cierreAnt,
    variacion,
    apertura: nz(item.openingPrice),
    maximo: nz(item.tradingHighPrice),
    minimo: nz(item.tradingLowPrice),
    volumen: nz(item.volume) ?? nz(item.volumeAmount),
    moneda: item.denominationCcy ?? 'ARS',
  }
}

async function fetchAll(): Promise<CEDEAR[]> {
  const CACHE_KEY = 'cedears:all'
  const hit = cache.get<CEDEAR[]>(CACHE_KEY)
  if (hit) return hit

  const res = await fetch(BYMA_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; api-finanzas-ar/1.0)',
    },
    body: JSON.stringify({
      excludeZeroPxAndQty: false,
      T1: false,
      T0: false,
      'Content-Type': 'application/json',
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`BYMA status ${res.status}`)

  const raw = await res.json()
  const items: BymaItem[] = Array.isArray(raw) ? raw : (raw.data ?? raw.content ?? [])

  // BYMA devuelve la misma especie repetida por plazo de liquidación (24h/CI).
  // Deduplicamos por símbolo conservando el registro con más información (precio).
  const bySymbol = new Map<string, CEDEAR>()
  for (const item of items) {
    const c = mapItem(item)
    if (!c.simbolo) continue
    const existing = bySymbol.get(c.simbolo)
    if (!existing || (c.ultimoPrecio !== null && existing.ultimoPrecio === null)) {
      bySymbol.set(c.simbolo, c)
    }
  }

  const mapped = [...bySymbol.values()].sort((a, b) => a.simbolo.localeCompare(b.simbolo))
  cache.set(CACHE_KEY, mapped, CONFIG.CACHE_TTL.CEDEARS)
  return mapped
}

export async function getCEDEARs(page = 0, size = 50): Promise<{ data: CEDEAR[]; total: number; cached: boolean }> {
  try {
    const cachedAll = cache.get<CEDEAR[]>('cedears:all')
    const all = await fetchAll()
    const start = page * size
    const data = all.slice(start, start + size)
    return { data, total: all.length, cached: cachedAll !== null }
  } catch (err) {
    console.error('[cedears] BYMA error:', (err as Error).message)
    return { data: [], total: 0, cached: false }
  }
}

export async function getCEDEAR(simbolo: string): Promise<CEDEAR | null> {
  try {
    const all = await fetchAll()
    return all.find(c => c.simbolo.toUpperCase() === simbolo.toUpperCase()) ?? null
  } catch (err) {
    console.error('[cedears] BYMA error:', (err as Error).message)
    return null
  }
}
