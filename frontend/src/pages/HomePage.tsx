import { useEffect, useState, useCallback } from 'react'
import { fmt, pctStr, pctClass } from '../utils'

type Tab = 'gainers' | 'losers' | 'volume' | 'trending'

interface Pair {
  pairAddress?: string
  chainId?: string
  dexId?: string
  priceUsd?: string
  priceChange?: { h24?: number; h1?: number; m5?: number }
  volume?: { h24?: number }
  liquidity?: { usd?: number }
  marketCap?: number
  fdv?: number
  baseToken?: { symbol?: string; name?: string; address?: string }
  quoteToken?: { symbol?: string }
  info?: { imageUrl?: string }
}

interface Props { onOpenToken: (chain: string, addr: string) => void }

function sparklineSVG(change24h: number) {
  const up = change24h >= 0
  const seed = Math.abs(change24h) % 10
  const pts: [number, number][] = up
    ? [[0,32],[16,28-seed*.4],[32,22+seed*.3],[48,18-seed*.5],[64,14+seed*.2],[80,10-seed*.3],[100,6]]
    : [[0,6],[16,10+seed*.3],[32,14-seed*.2],[48,20+seed*.4],[64,24-seed*.3],[80,28+seed*.2],[100,32]]
  const line = pts.map(([x,y],i) => `${i===0?'M':'L'}${x},${y}`).join(' ')
  const area = `${line} L100,38 L0,38 Z`
  const color = up ? '#3fb950' : '#f85149'
  const gid = `sg${up?'u':'d'}${Math.round(seed)}`
  return `<svg width="100%" height="38" viewBox="0 0 100 38" fill="none" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${line}" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

export default function HomePage({ onOpenToken }: Props) {
  const [tab, setTab] = useState<Tab>('gainers')
  const [chainFilter, setChainFilter] = useState('')
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const queries = chainFilter
        ? [chainFilter === 'solana' ? 'SOL' : chainFilter === 'bsc' ? 'BNB' : chainFilter === 'ethereum' ? 'ETH' : 'USDT']
        : ['USDT', 'WETH', 'BNB', 'SOL']
      const results = await Promise.allSettled(queries.map(q => fetch(`/search?q=${encodeURIComponent(q)}`).then(r => r.json())))
      const seen = new Set<string>()
      let all: Pair[] = []
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const p of (r.value?.pairs ?? [])) {
            if (!seen.has(p.pairAddress) && p.priceUsd) {
              seen.add(p.pairAddress); all.push(p)
            }
          }
        }
      }
      if (chainFilter) all = all.filter(p => p.chainId === chainFilter)
      if (tab === 'gainers' || tab === 'trending') all.sort((a, b) => (b.priceChange?.h24 ?? -Infinity) - (a.priceChange?.h24 ?? -Infinity))
      else if (tab === 'losers') all.sort((a, b) => (a.priceChange?.h24 ?? Infinity) - (b.priceChange?.h24 ?? Infinity))
      else all.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
      setPairs(all)
      setUpdated(new Date().toLocaleTimeString())
    } finally { setLoading(false) }
  }, [tab, chainFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { const id = setInterval(load, 30000); return () => clearInterval(id) }, [load])

  const top = pairs.slice(0, 20)
  const totalVol = pairs.reduce((s, p) => s + (p.volume?.h24 ?? 0), 0)
  const avgChg = top.length ? top.reduce((s, p) => s + (p.priceChange?.h24 ?? 0), 0) / top.length : 0

  return (
    <div>
      {pairs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="stats-pill"><div className="sp-label">Pairs loaded</div><div className="sp-val">{pairs.length}</div></div>
          <div className="stats-pill"><div className="sp-label">Total 24h Vol</div><div className="sp-val">{fmt(totalVol)}</div></div>
          <div className="stats-pill"><div className="sp-label">Avg 24h Change</div><div className={`sp-val ${pctClass(avgChg)}`}>{pctStr(avgChg)}</div></div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          {(['gainers', 'losers', 'volume', 'trending'] as Tab[]).map(t => (
            <button key={t} className={`home-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}>
              {t === 'gainers' ? '🚀 Top Gainers' : t === 'losers' ? '📉 Top Losers' : t === 'volume' ? '🔥 Top Volume' : '⭐ Trending'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{updated ? `Updated ${updated}` : 'Loading…'}</span>
          <select value={chainFilter} onChange={e => setChainFilter(e.target.value)} style={{ width: 130, fontSize: '.8rem' }}>
            <option value="">All Chains</option>
            {['ethereum','bsc','solana','base','arbitrum','polygon'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {loading && !top.length
        ? <div className="loading" style={{ gridColumn: '1/-1', padding: 60 }}>Loading…</div>
        : (
          <div className="home-token-grid">
            {top.map((p, i) => {
              const chg = p.priceChange?.h24 ?? 0
              const up = chg >= 0
              const sym = p.baseToken?.symbol ?? '?'
              const icon = p.info?.imageUrl
              return (
                <div key={i} className="htc" onClick={() => onOpenToken(p.chainId ?? '', p.baseToken?.address ?? '')}>
                  <div className="htc-rank">#{i + 1}</div>
                  <div className="htc-header">
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {icon
                        ? <img src={icon} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : <div className="htc-icon">{sym[0]}</div>}
                    </div>
                    <div>
                      <div className="htc-name">{sym}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/{p.quoteToken?.symbol ?? '?'}</span></div>
                      <div className="htc-sub">
                        <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{p.chainId}</span>
                        <span>{p.dexId ?? ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="htc-price">{fmt(p.priceUsd)}</div>
                  <div className={`htc-change ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</div>
                  <div className="htc-stats">
                    <div className="htc-stat"><div className="s-label">24h Volume</div><div className="s-val">{fmt(p.volume?.h24)}</div></div>
                    <div className="htc-stat"><div className="s-label">Liquidity</div><div className="s-val">{fmt(p.liquidity?.usd)}</div></div>
                    <div className="htc-stat"><div className="s-label">Mkt Cap</div><div className="s-val">{fmt(p.marketCap ?? p.fdv)}</div></div>
                    <div className="htc-stat"><div className="s-label">1h Change</div>
                      <div className={`s-val ${pctClass(p.priceChange?.h1 ?? 0)}`}>{pctStr(p.priceChange?.h1)}</div>
                    </div>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: sparklineSVG(chg) }} />
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
