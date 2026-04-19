import { useState } from 'react'

type Page = 'home' | 'chart' | 'trades' | 'token' | 'search' | 'swap' | 'portfolio' | 'chains'

interface Props {
  page: Page
  onNav: (p: Page) => void
  onSearch: (q: string) => void
}

export default function Nav({ page, onNav, onSearch }: Props) {
  const [q, setQ] = useState('')
  const links: { id: Page; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'chart', label: 'Chart' },
    { id: 'trades', label: 'Trades' },
    { id: 'token', label: 'Token' },
    { id: 'search', label: 'Search' },
    { id: 'swap', label: 'Swap' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'chains', label: 'Chains' },
  ]
  return (
    <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <img src="/logo.svg" alt="Cryptyos" style={{ height: 32 }} />
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-.5px' }}>Cryptyos</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {links.map(l => (
          <div key={l.id} className={`nav-link${page === l.id ? ' active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: 6, fontSize: '.85rem', color: page === l.id ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', background: page === l.id ? 'var(--bg3)' : 'transparent', whiteSpace: 'nowrap' }}
            onClick={() => onNav(l.id)}>{l.label}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, maxWidth: 340, width: '100%' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search token or pair…"
          style={{ padding: '6px 12px', fontSize: '.85rem' }}
          onKeyDown={e => e.key === 'Enter' && q && onSearch(q)} />
        <button className="btn-primary" onClick={() => q && onSearch(q)}>Go</button>
      </div>
    </nav>
  )
}
