import { useEffect, useRef } from 'react'
import { fmt } from '../utils'

interface TickerItem {
  name?: string
  marketCap?: number
  marketCapChange?: { h24?: number }
}

export default function Ticker() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await fetch('/trending')
        if (!r.ok || cancelled) return
        const data: TickerItem[] = await r.json()
        if (!Array.isArray(data) || !data.length || !ref.current) return
        const items = data.slice(0, 12).map(t => {
          const chg = t.marketCapChange?.h24 ?? 0
          const cls = chg >= 0 ? 'up' : 'down'
          return `<span class="ticker-item"><span class="name">${t.name ?? '?'}</span><span class="price">${fmt(t.marketCap)}</span><span class="${cls}">${chg >= 0 ? '▲' : '▼'}${Math.abs(chg).toFixed(1)}%</span></span>`
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
