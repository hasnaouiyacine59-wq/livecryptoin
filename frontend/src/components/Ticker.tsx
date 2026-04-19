import { useEffect, useRef } from 'react'
import { fmt, pctStr, pctClass } from '../utils'

export default function Ticker() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Fall back to search for pairs with real price data
        const r = await fetch('/search?q=USDT')
        if (!r.ok || cancelled) return
        const data = await r.json()
        const pairs: Record<string, unknown>[] = data?.pairs ?? []
        if (!pairs.length || !ref.current) return
        const top = pairs
          .filter(p => p.priceUsd && (p.priceChange as Record<string, unknown>)?.h24 != null)
          .slice(0, 14)
        const items = top.map(p => {
          const base = (p.baseToken ?? {}) as Record<string, unknown>
          const chg = ((p.priceChange as Record<string, unknown>)?.h24 as number) ?? 0
          return `<span class="ticker-item"><span class="name">${base.symbol ?? '?'}</span><span class="price">${fmt(p.priceUsd)}</span><span class="${pctClass(chg)}">${pctStr(chg)}</span></span>`
        }).join('')
        ref.current.innerHTML = items + items
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <div className="ticker-bar">
      <div className="ticker-inner" ref={ref}>Loading market data…</div>
    </div>
  )
}
