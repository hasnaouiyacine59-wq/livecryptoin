import { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode, IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts'
import { fmt, CHAINS } from '../utils'

interface Props { initialPool?: string; initialChain?: string }

export default function ChartPage({ initialPool, initialChain }: Props) {
  const [chain, setChain] = useState(initialChain ?? 'bsc')
  const [pool, setPool] = useState(initialPool ?? 'BTCUSDT')
  const [tf, setTf] = useState('hour')
  const [limit, setLimit] = useState('100')
  const [error, setError] = useState('')
  const [source, setSource] = useState('')
  const [stats, setStats] = useState<{ label: string; value: string; change?: string }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  async function load() {
    setError(''); setStats([]); setSource('')
    if (!pool) { setError('Enter a pool address'); return }
    if (containerRef.current) containerRef.current.innerHTML = '<div class="loading">Loading chart…</div>'
    try {
      const r = await fetch(`/chart/${chain}/${pool}?timeframe=${tf}&limit=${limit}`)
      if (!r.ok) throw new Error((await r.json()).detail ?? r.statusText)
      const data = await r.json()
      const ohlcv: number[][] = data?.data?.attributes?.ohlcv_list ?? []
      if (!ohlcv.length) throw new Error('No OHLCV data returned')

      const candles = ohlcv.map(c => ({
        time: c[0] as number,
        open: c[1], high: c[2], low: c[3], close: c[4], value: c[5]
      })).sort((a, b) => a.time - b.time)

      if (!containerRef.current) return
      containerRef.current.innerHTML = ''
      chartRef.current?.remove()

      const chart = createChart(containerRef.current, {
        layout: { background: { color: '#21262d' }, textColor: '#e6edf3' },
        grid: { vertLines: { color: '#30363d' }, horzLines: { color: '#30363d' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#30363d' },
        timeScale: { borderColor: '#30363d', timeVisible: true },
        width: containerRef.current.clientWidth,
        height: 420,
      })
      chartRef.current = chart

      const cs = chart.addCandlestickSeries({
        upColor: '#3fb950', downColor: '#f85149',
        borderUpColor: '#3fb950', borderDownColor: '#f85149',
        wickUpColor: '#3fb950', wickDownColor: '#f85149',
      })
      candleRef.current = cs
      cs.setData(candles as CandlestickData[])

      const vs = chart.addHistogramSeries({
        color: '#58a6ff', priceFormat: { type: 'volume' },
        priceScaleId: 'vol', scaleMargins: { top: 0.8, bottom: 0 },
      })
      vs.setData(candles.map(c => ({ time: c.time, value: c.value, color: c.close >= c.open ? '#3fb95055' : '#f8514955' })) as HistogramData[])
      chart.timeScale().fitContent()

      const last = candles[candles.length - 1]
      const chg = ((last.close - candles[0].open) / candles[0].open * 100).toFixed(2)
      const chgNum = parseFloat(chg)
      setStats([
        { label: 'Price', value: fmt(last.close), change: `${chgNum >= 0 ? '+' : ''}${chg}%` },
        { label: 'Open', value: fmt(last.open) },
        { label: 'High', value: fmt(last.high) },
        { label: 'Low', value: fmt(last.low) },
      ])
      const srcMap: Record<string, string> = {
        binance: '📊 Binance',
        geckoterminal: '🦎 GeckoTerminal (cached 5min)',
        dexscreener_synthetic: '⚠️ DexScreener synthetic',
      }
      setSource('Data source: ' + (srcMap[data.source] ?? data.source ?? 'unknown'))
    } catch (e: unknown) {
      if (containerRef.current) containerRef.current.innerHTML = ''
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialPool) { setPool(initialPool); setChain(initialChain ?? 'bsc') }
  }, [initialPool, initialChain])

  useEffect(() => {
    const onResize = () => chartRef.current?.applyOptions({ width: containerRef.current?.clientWidth ?? 800 })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div>
      <div className="section-title">📈 OHLCV Chart</div>
      <div className="row">
        <div className="field">
          <label>Chain</label>
          <select value={chain} onChange={e => setChain(e.target.value)} style={{ width: 140 }}>
            {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 260 }}>
          <label>Pool Address or Ticker</label>
          <input value={pool} onChange={e => setPool(e.target.value)} placeholder="0x… or BTCUSDT"
            onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <div className="field">
          <label>Timeframe</label>
          <select value={tf} onChange={e => setTf(e.target.value)} style={{ width: 110 }}>
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
            <option value="day">Day</option>
          </select>
        </div>
        <div className="field">
          <label>Limit</label>
          <input type="number" value={limit} onChange={e => setLimit(e.target.value)} style={{ width: 80 }} />
        </div>
        <button className="btn-primary" onClick={load}>Load</button>
      </div>
      <div className="timeframe-btns">
        {(['minute', 'hour', 'day'] as const).map(t => (
          <button key={t} className={`tf-btn${tf === t ? ' active' : ''}`}
            onClick={() => { setTf(t); setTimeout(load, 0) }}>
            {t === 'minute' ? '1m' : t === 'hour' ? '1h' : '1d'}
          </button>
        ))}
      </div>
      <div ref={containerRef} style={{ height: 420, borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)', marginBottom: 16 }} />
      {stats.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 8 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
              {s.change && <div className={`change ${parseFloat(s.change) >= 0 ? 'up' : 'down'}`}>{s.change}</div>}
            </div>
          ))}
        </div>
      )}
      {source && <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>{source}</div>}
      {error && <div className="error-msg">⚠️ {error}</div>}
    </div>
  )
}
