export const CHAIN_META: Record<string, { name: string; emoji: string; id: number }> = {
  ethereum: { name: 'Ethereum', emoji: '⟠', id: 1 },
  bsc: { name: 'BNB Chain', emoji: '🟡', id: 56 },
  polygon: { name: 'Polygon', emoji: '🟣', id: 137 },
  avalanche: { name: 'Avalanche', emoji: '🔺', id: 43114 },
  fantom: { name: 'Fantom', emoji: '👻', id: 250 },
  arbitrum: { name: 'Arbitrum', emoji: '🔵', id: 42161 },
  cronos: { name: 'Cronos', emoji: '🐾', id: 25 },
  optimism: { name: 'Optimism', emoji: '🔴', id: 10 },
  base: { name: 'Base', emoji: '🔷', id: 8453 },
  solana: { name: 'Solana', emoji: '◎', id: 1399811149 },
}

export function fmt(n: unknown): string {
  if (n == null) return '—'
  const v = parseFloat(String(n))
  if (isNaN(v)) return '—'
  if (Math.abs(v) >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B'
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(2) + 'K'
  if (Math.abs(v) < 0.0001) return '$' + v.toExponential(3)
  return '$' + v.toFixed(v < 1 ? 6 : 2)
}

export function fmtNum(n: unknown): string {
  if (n == null) return '—'
  const v = parseFloat(String(n))
  if (isNaN(v)) return '—'
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(2) + 'K'
  return v.toFixed(4)
}

export function fmtTime(ts: unknown): string {
  if (!ts) return '—'
  const n = typeof ts === 'number' && ts < 1e12 ? ts * 1000 : Number(ts)
  return new Date(n).toLocaleTimeString()
}

export function pctClass(v: number): string {
  return v >= 0 ? 'up' : 'down'
}

export function pctStr(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export const CHAINS = ['ethereum', 'bsc', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'cronos', 'optimism', 'base', 'solana']
