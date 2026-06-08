import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CONFIG } from '../config'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) return null
  if (!client) {
    client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  }
  return client
}
