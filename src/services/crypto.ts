import { cache } from '../lib/cache'
import { CONFIG } from '../config'

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price'

const COINS = [
  { id: 'bitcoin',      simbolo: 'BTC',  nombre: 'Bitcoin' },
  { id: 'ethereum',     simbolo: 'ETH',  nombre: 'Ethereum' },
  { id: 'tether',       simbolo: 'USDT', nombre: 'Tether USD' },
  { id: 'usd-coin',     simbolo: 'USDC', nombre: 'USD Coin' },
  { id: 'binancecoin',  simbolo: 'BNB',  nombre: 'BNB' },
  { id: 'solana',       simbolo: 'SOL',  nombre: 'Solana' },
  { id: 'ripple',       simbolo: 'XRP',  nombre: 'XRP' },
  { id: 'dai',          simbolo: 'DAI',  nombre: 'Dai' },
]

export interface CryptoPrice {
  id: string
  simbolo: string
  nombre: string
  precio_usd: number | null
  precio_ars: number | null
  variacion_24h: number | null
  volumen_24h_usd: number | null
  market_cap_usd: number | null
}

export async function getCryptoPrices(): Promise<{ data: CryptoPrice[]; cached: boolean }> {
  const CACHE_KEY = 'crypto:prices'
  const hit = cache.get<CryptoPrice[]>(CACHE_KEY)
  if (hit) return { data: hit, cached: true }

  try {
    const ids = COINS.map(c => c.id).join(',')
    const url = `${COINGECKO_URL}?ids=${ids}&vs_currencies=usd,ars&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`CoinGecko status ${res.status}`)

    const raw = await res.json()

    const data: CryptoPrice[] = COINS.map(coin => {
      const p = raw[coin.id] ?? {}
      return {
        id: coin.id,
        simbolo: coin.simbolo,
        nombre: coin.nombre,
        precio_usd: p.usd ?? null,
        precio_ars: p.ars ?? null,
        variacion_24h: p.usd_24h_change != null
          ? parseFloat((p.usd_24h_change as number).toFixed(2))
          : null,
        volumen_24h_usd: p.usd_24h_vol ?? null,
        market_cap_usd: p.usd_market_cap ?? null,
      }
    })

    cache.set(CACHE_KEY, data, CONFIG.CACHE_TTL.CRYPTO)
    return { data, cached: false }
  } catch (err) {
    console.error('[crypto] CoinGecko error:', (err as Error).message)
    return { data: [], cached: false }
  }
}
