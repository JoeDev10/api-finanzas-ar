export interface DollarQuote {
  tipo: string
  nombre: string
  compra: number | null
  venta: number | null
  spread: number | null
  variacion: number | null
  actualizado: string
  fuente: string
}

export interface InflacionData {
  periodo: string
  indice: number | null
  variacion_mensual: number | null
  variacion_interanual: number | null
}

export interface BCRAVariable {
  id: number
  nombre: string
  valor: number
  fecha: string
  unidad: string
}

export interface ApiKey {
  id: string
  key: string
  name: string
  email: string
  tier: 'free' | 'pro' | 'enterprise'
  daily_limit: number
  requests_today: number
  is_active: boolean
}

export interface ApiSuccess<T> {
  success: true
  data: T
  timestamp: string
  cache?: 'HIT' | 'MISS'
  fuente?: string
  meta?: Record<string, unknown>
}

export interface ApiError {
  success: false
  error: { code: string; message: string }
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
