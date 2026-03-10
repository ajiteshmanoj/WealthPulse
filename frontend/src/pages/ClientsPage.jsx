import { useQuery } from '@tanstack/react-query'
import { getClients } from '../services/api'
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

function getScoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  if (score >= 35) return '#f97316'
  return '#ef4444'
}

function formatAUM(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  return `$${(val / 1000).toFixed(0)}K`
}

export default function ClientsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Client Book</h2>
          <p>Loading adviser dashboard...</p>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  const clients = data?.clients || []
  const avgScore = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.wellness_score, 0) / clients.length)
    : 0
  const atRisk = clients.filter(c => c.wellness_score < 50).length
  const totalAUM = clients.reduce((s, c) => s + c.aum, 0)

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Client Book</h2>
        <p>Adviser view — manage and monitor your client portfolio</p>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{clients.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total AUM</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{formatAUM(totalAUM)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Wellness</div>
          <div className="stat-value" style={{ color: getScoreColor(avgScore) }}>{avgScore}</div>
        </div>
        <div className="stat-card" style={{ borderColor: atRisk > 0 ? '#ef444430' : undefined }}>
          <div className="stat-label">At Risk</div>
          <div className="stat-value" style={{ color: atRisk > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {atRisk}
          </div>
        </div>
      </div>

      {/* Client cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clients.sort((a, b) => a.wellness_score - b.wellness_score).map(client => {
          const scoreColor = getScoreColor(client.wellness_score)
          return (
            <div key={client.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 200 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${scoreColor}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: scoreColor,
                    border: `1px solid ${scoreColor}40`,
                  }}>
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Age {client.age} · {client.risk_profile}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor }}>
                    {client.wellness_score}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                    Wellness
                  </div>
                </div>

                {/* AUM */}
                <div style={{ minWidth: 100 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{formatAUM(client.aum)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AUM</div>
                </div>

                {/* Portfolio bars */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden',
                    background: 'var(--bg-secondary)'
                  }}>
                    <div style={{ width: `${client.portfolio_summary.equities_pct}%`, background: '#3b82f6' }} />
                    <div style={{ width: `${client.portfolio_summary.bonds_pct}%`, background: '#10b981' }} />
                    <div style={{ width: `${client.portfolio_summary.cash_pct}%`, background: '#f59e0b' }} />
                    <div style={{ width: `${client.portfolio_summary.crypto_pct}%`, background: '#8b5cf6' }} />
                    <div style={{ width: `${client.portfolio_summary.other_pct}%`, background: '#f97316' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: '#3b82f6' }}>EQ {client.portfolio_summary.equities_pct}%</span>
                    <span style={{ fontSize: 10, color: '#10b981' }}>BD {client.portfolio_summary.bonds_pct}%</span>
                    <span style={{ fontSize: 10, color: '#f59e0b' }}>CA {client.portfolio_summary.cash_pct}%</span>
                    <span style={{ fontSize: 10, color: '#8b5cf6' }}>CR {client.portfolio_summary.crypto_pct}%</span>
                  </div>
                </div>

                {/* Goal */}
                <div style={{ minWidth: 140, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{client.goal_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {client.goal_on_track ? (
                      <>
                        <CheckCircle size={12} color="var(--accent-green)" />
                        <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>On Track</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} color="var(--accent-red)" />
                        <span style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 600 }}>Off Track</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk flags */}
                <div style={{ minWidth: 180 }}>
                  {client.risk_flags.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>No risk flags</span>
                  ) : (
                    client.risk_flags.slice(0, 2).map((flag, i) => (
                      <div key={i} style={{
                        fontSize: 11, color: 'var(--accent-orange)',
                        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2
                      }}>
                        <AlertTriangle size={10} /> {flag}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
