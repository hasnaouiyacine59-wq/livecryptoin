import { useState } from 'react'
import { fmt, pctStr, pctClass, CHAINS } from '../utils'

interface Props { onOpenToken: (chain: string, addr: string) => void }

export default function TokenPage({ onOpenToken }: Props) {
  const [chain, setChain] = useState('bsc')
  const [addr, setAddr] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ label: string; value: string; change?: string }[]>([])
  const [pairs, setPairs] = useState<Record<string, unknown>[]>([])

  async function load() {
    setError(''); setStats([]); setPairs([])
    if (!addr) { setError('Enter a token address'); return }
    try {
      const r = await fetch(`/token/${chain}/${addr}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      const data = await r.json()
      const ps: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.pairs ?? [])
      if (!ps.length) throw new Error('No data found for this token')
      const p = ps[0] as Record<string, Record<string, unknown>>
      setStats([
        { label: 'Price USD', value: fmt(p.priceUsd), change: pctStr(p.priceChange?.h24 as number) },
        { label: '24h Volume', value: fmt(p.volume?.h24) },
        { label: 'Liquidity', value: fmt(p.liquidity?.usd) },
        { label: 'Market Cap', value: fmt(p.marketCap ?? p.fdv) },
      ])
      setPairs(ps)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <div className="section-title">🪙 Token Info</div>
      <div className="row">
        <div className="field">
          <label>Chain</label>
          <select value={chain} onChange={e => setChain(e.target.value)} style={{ width: 140 }}>
            {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 260 }}>
          <label>Token Address</label>
          <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="0x…"
            onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <button className="btn-primary" onClick={load}>Load</button>
      </div>
      {error && <div className="error-msg">⚠️ {error}</div>}
      {stats.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 16 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
              {s.change && <div className={`change ${pctClass(parseFloat(s.change))}`}>{s.change}</div>}
            </div>
          ))}
        </div>
      )}
      {pairs.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 20 }}>Trading Pairs ({pairs.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Pair</th><th>DEX</th><th>Chain</th><th>Price</th><th>24h Vol</th><th>Liquidity</th><th>5m</th><th>1h</th><th>24h</th></tr></thead>
              <tbody>
                {pairs.map((pair, i) => {
                  const p = pair as Record<string, Record<string, unknown>>
                  return (
                    <tr key={i} style={{ cursor: 'pointer' }}
                      onClick={() => onOpenToken(String(pair.chainId ?? ''), String(p.baseToken?.address ?? ''))}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="token-icon">{String(p.baseToken?.symbol ?? '?')[0]}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{String(p.baseToken?.symbol ?? '?')}/{String(p.quoteToken?.symbol ?? '?')}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{String(pair.pairAddress ?? '').slice(0, 10)}…</div>
                          </div>
                        </div>
                      </td>
                      <td>{String(pair.dexId ?? '—')}</td>
                      <td><span className="badge badge-chain">{String(pair.chainId ?? '—')}</span></td>
                      <td>{fmt(pair.priceUsd)}</td>
                      <td>{fmt(p.volume?.h24)}</td>
                      <td>{fmt(p.liquidity?.usd)}</td>
                      <td className={pctClass(p.priceChange?.m5 as number)}>{pctStr(p.priceChange?.m5 as number)}</td>
                      <td className={pctClass(p.priceChange?.h1 as number)}>{pctStr(p.priceChange?.h1 as number)}</td>
                      <td className={pctClass(p.priceChange?.h24 as number)}>{pctStr(p.priceChange?.h24 as number)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
