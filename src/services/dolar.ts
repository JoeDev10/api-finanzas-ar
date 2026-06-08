import { cache } from '../lib/cache'
import { CONFIG } from '../config'
import type { DollarQuote } from '../types'

const DOLARAPI_URL = 'https://dolarapi.com/v1/dolares'
const BLUELYTICS_URL = 'https://api.bluelytics.com.ar/v2/latest'
const CACHE_KEY = 'dolar:all'

const TIPO_ALIAS: Record<string, string> = {
  bolsa: 'mep',
  contadoconliqui: 'ccl',
}

interface DolarApiItem {
  casa: string
  nombre: string
  compra: number | null
  venta: number | null
  fechaActualizacion: string
}

function calcSpread(compra: number | null, venta: number | null): number | null {
  if (!compra || !venta) return null
  return parseFloat(((venta - compra) / compra * 100).toFixed(2))
}

async function fromDolarApi(): Promise<DollarQuote[]> {
  const res = await fetch(DOLARAPI_URL, {
    headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`dolarapi status ${res.status}`)

  const data: DolarApiItem[] = await res.json()
  return data.map(item => ({
    tipo: TIPO_ALIAS[item.casa] ?? item.casa,
    nombre: item.nombre,
    compra: item.compra,
    venta: item.venta,
    spread: calcSpread(item.compra, item.venta),
    variacion: null,
    actualizado: item.fechaActualizacion,
    fuente: 'dolarapi.com',
  }))
}

async function fromBluelytics(): Promise<DollarQuote[]> {
  const res = await fetch(BLUELYTICS_URL, {
    headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`bluelytics status ${res.status}`)

  const data = await res.json()
  const quotes: DollarQuote[] = []

  if (data.oficial) {
    quotes.push({
      tipo: 'oficial',
      nombre: 'Oficial',
      compra: data.oficial.value_buy,
      venta: data.oficial.value_sell,
      spread: calcSpread(data.oficial.value_buy, data.oficial.value_sell),
      variacion: data.oficial.variation ?? null,
      actualizado: data.last_update,
      fuente: 'bluelytics.com.ar',
    })
  }
  if (data.blue) {
    quotes.push({
      tipo: 'blue',
      nombre: 'Blue',
      compra: data.blue.value_buy,
      venta: data.blue.value_sell,
      spread: calcSpread(data.blue.value_buy, data.blue.value_sell),
      variacion: data.blue.variation ?? null,
      actualizado: data.last_update,
      fuente: 'bluelytics.com.ar',
    })
  }
  return quotes
}

export async function getDollarQuotes(): Promise<{ quotes: DollarQuote[]; cached: boolean }> {
  const hit = cache.get<DollarQuote[]>(CACHE_KEY)
  if (hit) return { quotes: hit, cached: true }

  let quotes: DollarQuote[] = []
  try {
    quotes = await fromDolarApi()
  } catch (err) {
    console.error('[dolar] dolarapi.com failed, trying bluelytics:', (err as Error).message)
    try {
      quotes = await fromBluelytics()
    } catch (err2) {
      console.error('[dolar] bluelytics failed:', (err2 as Error).message)
    }
  }

  if (quotes.length > 0) cache.set(CACHE_KEY, quotes, CONFIG.CACHE_TTL.DOLAR)
  return { quotes, cached: false }
}

export async function getDollarQuote(tipo: string): Promise<DollarQuote | null> {
  const { quotes } = await getDollarQuotes()
  return quotes.find(q => q.tipo === tipo) ?? null
}

export async function refreshDollarQuotes(): Promise<void> {
  cache.delete(CACHE_KEY)
  await getDollarQuotes()
  console.log('[dolar] refreshed')
}
