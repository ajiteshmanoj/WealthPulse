import { useQuery } from '@tanstack/react-query'
import { getNews } from '../services/api'
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

export default function NewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: getNews,
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

  const items = data?.items || []

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Market Pulse</h2>
        <p>Macro news with AI-powered sentiment analysis</p>
      </div>

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
                    {item.headline}
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
