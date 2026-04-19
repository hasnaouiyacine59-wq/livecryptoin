interface Props { onModal: (key: string) => void; onNav: (page: string) => void }

export default function Footer({ onModal, onNav }: Props) {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <img src="/logo.svg" alt="Cryptyos" style={{ height: 32 }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cryptyos</span>
          </div>
          <p>Professional-grade realtime DEX data platform. Live charts, trades, token analytics, cross-chain swaps and portfolio tracking — all free, no API keys required.</p>
          <div className="socials">
            <a className="social-btn" href="#" title="Twitter/X">𝕏</a>
            <a className="social-btn" href="#" title="Telegram">✈</a>
            <a className="social-btn" href="#" title="Discord">💬</a>
            <a className="social-btn" href="#" title="GitHub">⌥</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          {[['chart','📈 Live Chart'],['trades','⚡ Trades'],['token','🪙 Token Info'],['search','🔍 Search'],['swap','🔄 Swap / Bridge'],['portfolio','💼 Portfolio']].map(([id,label]) => (
            <a key={id} href="#" onClick={e => { e.preventDefault(); onNav(id) }}>{label}</a>
          ))}
        </div>
        <div className="footer-col">
          <h4>Data Sources</h4>
          <a href="https://www.geckoterminal.com/dex-api" target="_blank" rel="noopener">GeckoTerminal <span className="badge-free">FREE</span></a>
          <a href="https://docs.dexscreener.com" target="_blank" rel="noopener">DexScreener <span className="badge-free">FREE</span></a>
          <a href="https://li.quest" target="_blank" rel="noopener">LiFi Aggregator <span className="badge-free">FREE</span></a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#" onClick={e => { e.preventDefault(); onModal('disclaimer') }}>Disclaimer</a>
          <a href="#" onClick={e => { e.preventDefault(); onModal('privacy') }}>Privacy Policy</a>
          <a href="#" onClick={e => { e.preventDefault(); onModal('terms') }}>Terms of Use</a>
          <a href="/docs" target="_blank">API Docs</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Cryptyos. All rights reserved.</span>
        <div className="legal">
          <a href="#" onClick={e => { e.preventDefault(); onModal('disclaimer') }}>Disclaimer</a>
          <a href="#" onClick={e => { e.preventDefault(); onModal('privacy') }}>Privacy</a>
          <a href="#" onClick={e => { e.preventDefault(); onModal('terms') }}>Terms</a>
        </div>
        <span>Not financial advice. Data via GeckoTerminal, DexScreener &amp; LiFi.</span>
      </div>
    </footer>
  )
}
