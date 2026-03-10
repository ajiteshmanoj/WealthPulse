import { useQuery } from '@tanstack/react-query'
import { getRecommendations } from '../../services/api'
import { AlertTriangle, Lightbulb, Eye, Brain } from 'lucide-react'

const PRIORITY_CONFIG = {
  urgent: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: AlertTriangle, label: 'Urgent' },
  suggested: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', icon: Lightbulb, label: 'Suggested' },
  consider: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', icon: Eye, label: 'Consider' },
}

export default function Recommendations({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => getRecommendations(userId),
  })

  if (isLoading) {
    return (
      <div className="card glow-purple" style={{ minHeight: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Brain size={20} color="var(--accent-purple)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>AI Recommendations</h3>
        </div>
        <div className="loading-container"><div className="spinner" /> Generating insights...</div>
      </div>
    )
  }

  const recs = data?.recommendations || []

  return (
    <div className="card glow-purple">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Brain size={20} color="var(--accent-purple)" />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>AI Recommendations</h3>
        {data?.source === 'ai' && <span className="badge badge-purple">Live AI</span>}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
        Powered by Claude — personalized for your portfolio
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {recs.map((rec, i) => {
          const config = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.consider
          const Icon = config.icon
          return (
            <div key={i} style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon size={16} color={config.color} />
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: config.color
                }}>
                  {config.label}
                </span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{rec.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {rec.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
