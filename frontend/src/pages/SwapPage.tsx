import { useState } from 'react'
import { fmtNum, fmt } from '../utils'

export default function SwapPage() {
  const [fromChain, setFromChain] = useState('56')
  const [toChain, setToChain] = useState('1')
  const [fromToken, setFromToken] = useState('')
  const [toToken, setToToken] = useState('')
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState('')
  const [error, setError] = useState('')
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  async function getQuote() {
    setError(''); setQuote(null)
    if (!fromChain || !toChain || !fromToken || !toToken || !amount || !wallet) {
      setError('Fill all fields'); return
    }
    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString()
    setLoading(true)
    try {
      const r = await fetch(`/swap/quote?from_chain=${fromChain}&to_chain=${toChain}&from_token=${fromToken}&to_token=${toToken}&from_amount=${amountWei}&from_address=${wallet}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      setQuote(await r.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  function swapDir() {
    setFromChain(toChain); setToChain(fromChain)
    setFromToken(toToken); setToToken(fromToken)
  }

  const est = (quote?.estimate ?? {}) as Record<string, unknown>
  const tool = (quote?.toolDetails ?? {}) as Record<string, unknown>
  const steps = (quote?.includedSteps ?? []) as Record<string, unknown>[]

  return (
    <div>
      <div className="section-title">🔄 Swap / Bridge</div>
      <div className="swap-card">
        <div className="swap-input-wrap">
          <div className="swap-top"><span>From</span></div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.0" style={{ fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: 'none', width: '60%' }} />
            <input value={fromToken} onChange={e => setFromToken(e.target.value)} placeholder="From token address" style={{ fontSize: '.8rem' }} />
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="field"><label>From Chain ID</label>
              <input type="number" value={fromChain} onChange={e => setFromChain(e.target.value)} placeholder="56" />
            </div>
          </div>
        </div>
        <div className="swap-arrow" onClick={swapDir}>⇅</div>
        <div className="swap-input-wrap">
          <div className="swap-top"><span>To</span></div>
          <input value={toToken} onChange={e => setToToken(e.target.value)} placeholder="To token address"
            style={{ fontSize: '.85rem', background: 'transparent', border: 'none', width: '100%' }} />
          <div style={{ marginTop: 8 }}>
            <div className="field"><label>To Chain ID</label>
              <input type="number" value={toChain} onChange={e => setToChain(e.target.value)} placeholder="1" />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="field"><label>Your Wallet Address</label>
            <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x…" />
          </div>
        </div>
        <button className="btn-green" style={{ width: '100%', marginTop: 16, padding: 14, fontSize: '1rem' }}
          onClick={getQuote} disabled={loading}>{loading ? 'Fetching…' : 'Get Quote'}</button>
        {error && <div className="error-msg" style={{ marginTop: 12 }}>⚠️ {error}</div>}
        {quote && (
          <div className="quote-box">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Quote via {String(tool.name ?? quote.tool ?? 'LiFi')}</div>
            <div className="quote-row"><span>From Amount</span><span>{fmtNum(Number(est.fromAmount) / 1e18)} tokens</span></div>
            <div className="quote-row"><span>To Amount</span><span>{fmtNum(Number(est.toAmount) / 1e18)} tokens</span></div>
            <div className="quote-row"><span>To Amount (min)</span><span>{fmtNum(Number(est.toAmountMin) / 1e18)}</span></div>
            <div className="quote-row"><span>Execution Time</span><span>{String(est.executionDuration ?? '—')}s</span></div>
            <div className="quote-row"><span>Gas Cost</span><span>{fmt((est.gasCosts as Record<string, unknown>[])?.[0]?.amountUSD)}</span></div>
            <div className="quote-row"><span>Route</span><span>{steps.map(s => String((s.toolDetails as Record<string, unknown>)?.name ?? s.tool)).join(' → ') || '—'}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
