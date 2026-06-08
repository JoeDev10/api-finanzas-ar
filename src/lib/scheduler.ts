import cron from 'node-cron'
import { refreshDollarQuotes } from '../services/dolar'
import { refreshBCRAVariables } from '../services/bcra'
import { getInflacion } from '../services/inflacion'
import { getCryptoPrices } from '../services/crypto'

export function initScheduler(): void {
  // Dólar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try { await refreshDollarQuotes() }
    catch (e) { console.error('[scheduler] dolar error:', e) }
  })

  // Variables BCRA cada hora
  cron.schedule('0 * * * *', async () => {
    try { await refreshBCRAVariables() }
    catch (e) { console.error('[scheduler] bcra error:', e) }
  })

  // Inflación una vez al día a las 8am ART (11 UTC)
  cron.schedule('0 11 * * *', async () => {
    try {
      await getInflacion(36)
      console.log('[scheduler] inflacion refreshed')
    } catch (e) { console.error('[scheduler] inflacion error:', e) }
  })

  // Crypto cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try { await getCryptoPrices() }
    catch (e) { console.error('[scheduler] crypto error:', e) }
  })

  console.log('[scheduler] initialized')

  // Pre-warm cache al arrancar
  setTimeout(async () => {
    console.log('[scheduler] pre-warming cache...')
    await Promise.allSettled([
      refreshDollarQuotes(),
      refreshBCRAVariables(),
      getInflacion(36),
      getCryptoPrices(),
    ])
    console.log('[scheduler] cache ready')
  }, 500)
}
