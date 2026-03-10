import { useQuery } from '@tanstack/react-query'
import { getNews } from '../services/api'
import { ExternalLink, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

const SENTIMENT = {
  positive: { color: '#10b981', icon: TrendingUp, label: 'Positive' },
  negative: { color: '#ef4444', icon: TrendingDown, label: 'Negative' },
  neutral: { color: '#64748b', icon: Minus, label: 'Neutral' },
}

const RELEVANCE_BADGE = {
  high: 'badge-red',
  medium: 'badge-yellow',
  low: 'badge-blue',
}

const DEMO_NEWS = [
  {
    id: '1', headline: 'Fed Holds Rates Steady, Signals Two Cuts Later in 2026',
    source: 'Reuters', time_ago: '2 hours ago', sentiment: 'positive', relevance: 'high',
    affected_asset_classes: ['equities', 'bonds'],
    summary: 'The Federal Reserve kept its benchmark rate unchanged at 4.25%, but the dot plot now projects two 25bp cuts by year-end, boosting equity futures and pressuring the US dollar.',
  },
  {
    id: '2', headline: 'Singapore MAS Tightens S$NEER Policy Band Amid Strong Capital Inflows',
    source: 'The Straits Times', time_ago: '3 hours ago', sentiment: 'neutral', relevance: 'high',
    affected_asset_classes: ['cash', 'bonds', 'equities'],
    summary: 'The Monetary Authority of Singapore slightly steepened its S$NEER policy band slope, signalling confidence in the domestic economy while managing imported inflation risks.',
  },
  {
    id: '3', headline: 'Bitcoin Breaks $100,000 as Institutional Adoption Accelerates',
    source: 'CNBC', time_ago: '5 hours ago', sentiment: 'positive', relevance: 'high',
    affected_asset_classes: ['crypto', 'tokenised_assets'],
    summary: 'Bitcoin surpassed the $100,000 mark for the first time, driven by record spot ETF inflows from BlackRock and Fidelity, and growing sovereign wealth fund allocations across Asia.',
  },
  {
    id: '4', headline: 'DBS Reports Record Q1 Profit of SGD 3.2B, Raises Dividend',
    source: 'Yahoo Finance', time_ago: '6 hours ago', sentiment: 'positive', relevance: 'high',
    affected_asset_classes: ['equities'],
    summary: 'DBS Group posted a record first-quarter net profit of SGD 3.2 billion, beating estimates by 8%, and announced a special dividend of SGD 0.60 per share.',
  },
  {
    id: '5', headline: 'Schroders Launches Tokenised Bond Fund on Singapore Exchange',
    source: 'Financial Times', time_ago: '8 hours ago', sentiment: 'positive', relevance: 'high',
    affected_asset_classes: ['tokenised_assets', 'bonds'],
    summary: 'Schroders Capital partnered with SGX to list a tokenised investment-grade bond fund, lowering minimum investment to SGD 1,000 and enabling 24/7 secondary trading.',
  },
  {
    id: '6', headline: 'US-China Trade Tensions Resurface — New Tariffs on Tech Exports',
    source: 'Reuters', time_ago: '10 hours ago', sentiment: 'negative', relevance: 'medium',
    affected_asset_classes: ['equities', 'crypto'],
    summary: 'The White House announced new 25% tariffs on Chinese semiconductor equipment, escalating trade tensions and sending Asian tech indices down 2-3% in early trading.',
  },
  {
    id: '7', headline: 'Singapore REITs Outperform as CBD Office Rents Hit 5-Year High',
    source: 'Yahoo Finance', time_ago: '14 hours ago', sentiment: 'positive', relevance: 'medium',
    affected_asset_classes: ['equities', 'private_assets'],
    summary: 'The iEdge S-REIT Index rose 1.8% as Grade A CBD office rents climbed to SGD 12.50 psf/month, the highest since 2021, driven by strong demand from tech and finance firms.',
  },
  {
    id: '8', headline: 'Ethereum Layer 2 Adoption Surges — TVL Crosses $80 Billion',
    source: 'CNBC', time_ago: '1 day ago', sentiment: 'positive', relevance: 'medium',
    affected_asset_classes: ['crypto', 'tokenised_assets'],
    summary: 'Total value locked across Ethereum Layer 2 networks surpassed $80 billion, with Arbitrum and Base leading growth, signalling maturing infrastructure for tokenised real-world assets.',
  },
]

export default function NewsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['news'],
    queryFn: getNews,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Market Pulse</h2>
          <p>Loading market news...</p>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  const liveItems = data?.items || []
  const isDemo = isError || liveItems.length === 0
  const items = isDemo ? DEMO_NEWS : liveItems

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Market Pulse</h2>
        <p>Macro news with AI-powered sentiment analysis</p>
      </div>

      {isDemo && (
        <div style={{
          padding: '10px 16px', marginBottom: 16, borderRadius: 8,
          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: '#f59e0b',
        }}>
          <AlertTriangle size={14} />
          Showing cached demo data — live feed unavailable
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(item => {
          const sent = SENTIMENT[item.sentiment] || SENTIMENT.neutral
          const SentIcon = sent.icon
          return (
            <div key={item.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{item.source}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.time_ago}</span>
                    <span className={`badge ${RELEVANCE_BADGE[item.relevance]}`} style={{ fontSize: 10 }}>
                      {item.relevance} relevance
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <SentIcon size={12} color={sent.color} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: sent.color }}>{sent.label}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {item.headline} <ExternalLink size={12} style={{ verticalAlign: -1, opacity: 0.5 }} />
                      </a>
                    ) : item.headline}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                    {item.summary}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.affected_asset_classes?.map(ac => (
                      <span key={ac} className="badge badge-blue" style={{ fontSize: 10 }}>
                        {ac.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
