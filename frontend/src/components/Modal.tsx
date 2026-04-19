import { useEffect } from 'react'

const CONTENT: Record<string, { title: string; color: string; body: string }> = {
  disclaimer: {
    title: '⚠️ Disclaimer', color: 'var(--yellow)',
    body: `Cryptyos is a data aggregation platform for informational purposes only. Nothing on this platform constitutes financial, investment, legal or tax advice.
Cryptocurrency markets are highly volatile. Past performance is not indicative of future results. You should conduct your own research and consult a qualified financial advisor before making any investment decisions.
Cryptyos does not hold, custody, or transmit any digital assets. Swap quotes are provided by third-party aggregators (LiFi) and Cryptyos is not responsible for any losses arising from swap transactions.
Market data is sourced from GeckoTerminal and DexScreener and may be delayed or inaccurate.`
  },
  privacy: {
    title: '🔒 Privacy Policy', color: 'var(--blue)',
    body: `Data We Collect: Cryptyos does not collect, store or sell personal data. We do not require account registration or login.
Third-Party APIs: Queries you make (token addresses, wallet addresses) are forwarded to GeckoTerminal, DexScreener and LiFi to fetch data.
Cookies & Analytics: We do not use tracking cookies or third-party analytics scripts.`
  },
  terms: {
    title: '📄 Terms of Use', color: 'var(--green)',
    body: `By using Cryptyos you agree to these terms.
Permitted Use: This platform is provided for personal, non-commercial informational use. You may not scrape, resell or redistribute data obtained through this platform.
No Warranties: The platform is provided "as is" without warranties of any kind.
Limitation of Liability: Cryptyos shall not be liable for any direct, indirect, incidental or consequential damages arising from use of this platform.
© 2026 Cryptyos. All rights reserved.`
  },
}

interface Props { modalKey: string | null; onClose: () => void }

export default function Modal({ modalKey, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!modalKey) return null
  const c = CONTENT[modalKey]
  if (!c) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: 16, color: c.color }}>{c.title}</h2>
        {c.body.split('\n').map((line, i) => (
          <p key={i} style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '.88rem', marginBottom: 8 }}>{line}</p>
        ))}
      </div>
    </div>
  )
}
