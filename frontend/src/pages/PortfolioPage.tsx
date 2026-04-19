import { useState } from 'react'
import { fmt, pctStr, pctClass, CHAINS } from '../utils'

interface Props { onOpenToken: (chain: string, addr: string) => void }

export default function PortfolioPage({ onOpenToken }: Props) {
  const [chain, setChain] = useState('bsc')
  const [wallet, setWallet] = useState('')
  const [pairs, setPairs] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setError(''); setPairs([])
    if (!wallet) { setError('Enter a wallet address'); return }
    setLoading(true)
    try {
      const r = await fetch(`/portfolio/${chain}/${wallet}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      const data = await r.json()
      const ps: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.pairs ?? [])
      if (!ps.length) { setError('No token data found for this address'); return }
      setPairs(ps.slice(0, 24))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="section-title">💼 Portfolio</div>
      <div className="row">
        <div className="field">
          <label>Chain</label>
          <select value={chain} onChange={e => setChain(e.target.value)} style={{ width: 140 }}>
            {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 260 }}>
          <label>Wallet Address</label>
          <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x…"
            onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <button className="btn-primary" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
      </div>
      {error && <div className="error-msg">⚠️ {error}</div>}
      <div className="token-list">
        {pairs.map((p, i) => {
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
