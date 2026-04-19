import { useEffect, useRef, useState } from 'react'
import { fmt, fmtNum, fmtTime, CHAINS } from '../utils'

interface Props { initialPool?: string; initialChain?: string }

export default function TradesPage({ initialPool, initialChain }: Props) {
  const [chain, setChain] = useState(initialChain ?? 'bsc')
  const [pool, setPool] = useState(initialPool ?? '0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE')
  const [rows, setRows] = useState<React.ReactNode>(null)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [autoOn, setAutoOn] = useState(false)

  async function load() {
    setError('')
    if (!pool) { setError('Enter a pool address'); return }
    setRows(<tr><td colSpan={7} className="loading">Loading…</td></tr>)
    try {
      const r = await fetch(`/trades/${chain}/${pool}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      const data = await r.json()
      const trades: Record<string, unknown>[] = data?.data ?? []
      if (!trades.length) { setRows(<tr><td colSpan={7} className="loading">No trades found</td></tr>); return }
      setRows(trades.slice(0, 50).map((t, i) => {
        const a = (t.attributes ?? {}) as Record<string, unknown>
        const isBuy = a.kind === 'buy'
        const tx = String(a.tx_hash ?? '')
        return (
          <tr key={i}>
            <td><span className={`badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>{isBuy ? '▲ BUY' : '▼ SELL'}</span></td>
            <td>{fmt(a.price_from_in_usd ?? a.price_to_in_usd)}</td>
            <td>{fmtNum(a.from_token_amount)}</td>
            <td>{fmtNum(a.to_token_amount)}</td>
            <td>{fmt(a.volume_in_usd)}</td>
            <td>{fmtTime(a.block_timestamp)}</td>
            <td>{tx ? <span title={tx}>{tx.slice(0, 8)}…</span> : '—'}</td>
          </tr>
        )
      }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function toggleAuto() {
    if (autoOn) {
      if (timerRef.current) clearInterval(timerRef.current)
      setAutoOn(false)
    } else {
      load()
      timerRef.current = setInterval(load, 5000)
      setAutoOn(true)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <div>
      <div className="section-title">⚡ Recent Trades</div>
      <div className="row">
        <div className="field">
          <label>Chain</label>
          <select value={chain} onChange={e => setChain(e.target.value)} style={{ width: 140 }}>
            {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 260 }}>
          <label>Pool Address</label>
          <input value={pool} onChange={e => setPool(e.target.value)} placeholder="0x…"
            onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <button className="btn-primary" onClick={load}>Load</button>
        <button className="btn-ghost" onClick={toggleAuto}>{autoOn ? '⏹ Stop' : '🔄 Auto-refresh'}</button>
      </div>
      {error && <div className="error-msg">⚠️ {error}</div>}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Type</th><th>Price USD</th><th>Amount 0</th><th>Amount 1</th><th>Volume USD</th><th>Time</th><th>Tx</th></tr></thead>
          <tbody>{rows ?? <tr><td colSpan={7} className="loading">Enter a pool address and click Load</td></tr>}</tbody>
        </table>
      </div>
    </div>
  )
}
