import { cache } from '../lib/cache'
import { CONFIG } from '../config'
import type { BCRAVariable } from '../types'

// Fuente: apis.datos.gob.ar — la API v2 del BCRA fue deprecada (410 Gone)
const SERIES_URL = 'https://apis.datos.gob.ar/series/api/series/'

const VARIABLES = [
  { id: 1,  serieId: '92.1_RID_0_0_32',        nombre: 'Reservas Internacionales',   unidad: 'Millones USD',    freq: 'month' },
  { id: 2,  serieId: '90.1_BMCCB_0_0_36',       nombre: 'Base Monetaria',              unidad: 'Millones ARS',    freq: 'month' },
  { id: 3,  serieId: '89.2_TS_INTE_PM_0_D_16',  nombre: 'Tasa de Política Monetaria', unidad: '% TNA',           freq: 'day'   },
  { id: 4,  serieId: '89.2_TS_INTELAR_0_D_20',  nombre: 'BADLAR Privada',              unidad: '% TNA',           freq: 'day'   },
  { id: 5,  serieId: '94.2_UVAD_D_0_0_10',      nombre: 'UVA',                         unidad: 'ARS',             freq: 'day'   },
]

async function fetchSerie(serieId: string): Promise<{ valor: number; fecha: string } | null> {
  const url = new URL(SERIES_URL)
  url.searchParams.set('ids', serieId)
  url.searchParams.set('limit', '1')
  url.searchParams.set('sort', 'desc')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'api-finanzas-ar/1.0' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null

  const data = await res.json()
  const points: Array<[string, number]> = data.data ?? []
  if (!points.length) return null

  const [fecha, valor] = points[0]
  return { valor, fecha: fecha.substring(0, 10) }
}

export async function getBCRAVariables(): Promise<{ variables: BCRAVariable[]; cached: boolean }> {
  const CACHE_KEY = 'bcra:variables'
  const hit = cache.get<BCRAVariable[]>(CACHE_KEY)
  if (hit) return { variables: hit, cached: true }

  const variables: BCRAVariable[] = []

  await Promise.allSettled(
    VARIABLES.map(async (v) => {
      try {
        const data = await fetchSerie(v.serieId)
        if (data) {
          variables.push({
            id: v.id,
            nombre: v.nombre,
            valor: parseFloat(data.valor.toFixed(4)),
            fecha: data.fecha,
            unidad: v.unidad,
          })
        }
      } catch (err) {
        console.error(`[bcra] ${v.nombre} error:`, (err as Error).message)
      }
    })
  )

  variables.sort((a, b) => a.id - b.id)
  if (variables.length > 0) cache.set(CACHE_KEY, variables, CONFIG.CACHE_TTL.BCRA)
  return { variables, cached: false }
}

export async function getBCRAVariable(id: number): Promise<BCRAVariable | null> {
  const { variables } = await getBCRAVariables()
  return variables.find(v => v.id === id) ?? null
}

export async function getReservas(): Promise<{ valor: number; fecha: string; unidad: string } | null> {
  const CACHE_KEY = 'bcra:reservas'
  const hit = cache.get<{ valor: number; fecha: string; unidad: string }>(CACHE_KEY)
  if (hit) return hit

  const data = await fetchSerie('92.1_RID_0_0_32')
  if (!data) return null

  const result = { valor: parseFloat(data.valor.toFixed(2)), fecha: data.fecha, unidad: 'Millones USD' }
  cache.set(CACHE_KEY, result, CONFIG.CACHE_TTL.BCRA)
  return result
}

export async function refreshBCRAVariables(): Promise<void> {
  cache.delete('bcra:variables')
  cache.delete('bcra:reservas')
  await getBCRAVariables()
  console.log('[bcra] refreshed')
}
