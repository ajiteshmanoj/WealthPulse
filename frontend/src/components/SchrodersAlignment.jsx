import { Shield, Wallet, Layers, Sparkles } from 'lucide-react'

const TEAL = '#00A0AF'
const TEAL_DIM = 'rgba(0, 160, 175, 0.8)'

const cards = [
  {
    initiative: 'MAS Project Guardian',
    icon: Shield,
    title: 'Digital Readiness Scoring',
    description: 'Our Digital Readiness sub-score (15% of Wellness Score) tracks optimal 5-20% allocation to tokenised assets — supporting Project Guardian\'s vision for composable finance.',
    badge: 'Digital Readiness Sub-Score',
  },
  {
    initiative: 'MAS Project BLOOM',
    icon: Wallet,
    title: 'Unified Wealth Wallet',
    description: 'WealthPulse aggregates traditional portfolios, private holdings, crypto wallets, and tokenised deposits into a single Wealth Wallet — aligned with Project BLOOM\'s vision for digital money settlement.',
    badge: '6 Asset Classes',
  },
  {
    initiative: 'Digital Bonds & Tokenised ILS',
    icon: Layers,
    title: 'Tokenised Asset Tracking',
    description: 'Full lifecycle tracking of tokenised bonds, real estate tokens, and commodity tokens as first-class asset categories — the same instruments Schroders is actively issuing and investing in.',
    badge: 'Bonds · Property · Commodities',
  },
  {
    initiative: 'Operations Innovation',
    icon: Sparkles,
    title: 'Intelligent Recommendations',
    description: 'Claude AI delivers contextual, regulation-aware recommendations adapting to each investor\'s wellness profile — advancing Schroders\' journey toward a data-driven intelligent enterprise.',
    badge: 'Live AI Analysis',
  },
]

export default function SchrodersAlignment() {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        fontSize: 16, fontWeight: 600, marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 3, height: 20, borderRadius: 2,
          background: TEAL,
        }} />
        Aligned with Schroders Digital Asset Strategy
      </h3>
      <div className="schroders-grid">
        {cards.map((card, i) => (
          <div key={i} className="schroders-card">
            <span style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px',
              color: TEAL_DIM, fontWeight: 600, lineHeight: 1,
            }}>
              {card.initiative}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <card.icon size={16} color={TEAL} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {card.title}
              </span>
            </div>
            <p style={{
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
              margin: 0,
            }}>
              {card.description}
            </p>
            <span style={{
              alignSelf: 'flex-start', fontSize: 11, padding: '2px 10px',
              borderRadius: 12, background: 'rgba(0, 160, 175, 0.12)',
              color: TEAL, border: '1px solid rgba(0, 160, 175, 0.25)',
              fontWeight: 500,
            }}>
              {card.badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
