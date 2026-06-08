interface CacheItem<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private store = new Map<string, CacheItem<unknown>>()

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value as T
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  prune(): void {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) this.store.delete(key)
    }
  }
}

export const cache = new MemoryCache()

// En serverless (Vercel) no registramos timers de background: mantienen vivo
// el event loop e impiden que la función libere la respuesta. El get() ya
// verifica expiración de forma lazy, así que el prune periódico es opcional.
if (!process.env.VERCEL) {
  const timer = setInterval(() => cache.prune(), 5 * 60 * 1_000)
  timer.unref?.()
}
