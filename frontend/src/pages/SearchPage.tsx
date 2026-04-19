import { useState } from 'react'
import { fmt, pctStr, pctClass } from '../utils'

interface Props { initialQ?: string; onOpenToken: (chain: string, addr: string) => void }

export default function SearchPage({ initialQ, onOpenToken }: Props) {
  const [q, setQ] = useState(initialQ ?? '')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function doSearch() {
    setError('')
    if (q.length < 2) { setError('Enter at least 2 characters'); return }
    setLoading(true)
    try {
      const r = await fetch(`/search?q=${encodeURIComponent(q)}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      const data = await r.json()
      const pairs: Record<string, unknown>[] = data?.pairs ?? []
      setResults(pairs.slice(0, 24))
      if (!pairs.length) setError('No results found')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="section-title">🔍 Search Tokens &amp; Pairs</div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Query</label>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Token name, symbol or address…"
            onKeyDown={e => e.key === 'Enter' && doSearch()} />
        </div>
        <button className="btn-primary" onClick={doSearch}>Search</button>
      </div>
      {error && <div className="error-msg">⚠️ {error}</div>}
      {loading && <div className="loading">Searching…</div>}
      <div className="token-list">
        {results.map((p, i) => {
          const base = (p.baseToken ?? {}) as Record<string, unknown>
          const quote = (p.quoteToken ?? {}) as Record<string, unknown>
          const pc = (p.priceChange ?? {}) as Record<string, unknown>
          const vol = (p.volume ?? {}) as Record<string, unknown>
          const liq = (p.liquidity ?? {}) as Record<string, unknown>
          return (
            <div key={i} className="token-card"
              onClick={() => onOpenToken(String(p.chainId ?? ''), String(base.address ?? ''))}>
              <div className="t-header">
                <span className="token-icon">{String(base.symbol ?? '?')[0]}</span>
                <div>
                  <div className="t-name">{String(base.name ?? 'Unknown')}</div>
                  <div className="t-symbol">{String(base.symbol ?? '?')} / {String(quote.symbol ?? '?')}</div>
                </div>
              </div>
              <div className="t-price">
                {fmt(p.priceUsd)} <span className={pctClass(pc.h24 as number)}>{pctStr(pc.h24 as number)}</span>
              </div>
              <div className="t-stats">
                <span>Vol {fmt(vol.h24)}</span>
                <span>Liq {fmt(liq.usd)}</span>
                <span className="badge badge-chain">{String(p.chainId ?? '?')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
