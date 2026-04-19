import { CHAIN_META } from '../utils'

interface Props { onSelectChain: (chain: string) => void }

export default function ChainsPage({ onSelectChain }: Props) {
  return (
    <div>
      <div className="section-title">⛓️ Supported Chains</div>
      <div className="chains-grid">
        {Object.entries(CHAIN_META).map(([key, c]) => (
          <div key={key} className="chain-card" onClick={() => onSelectChain(key)}>
            <div className="chain-emoji">{c.emoji}</div>
            <div className="chain-name">{c.name}</div>
            <div className="chain-id">Chain ID: {c.id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
