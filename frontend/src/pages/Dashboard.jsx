import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getPortfolio, getWellness } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ScoreRing from '../components/WellnessScore/ScoreRing'
import ScoreBreakdown from '../components/WellnessScore/ScoreBreakdown'
import PortfolioSummary from '../components/Portfolio/PortfolioSummary'
import HoldingsTable from '../components/Portfolio/HoldingsTable'
import WealthChart from '../components/Portfolio/WealthChart'
import Recommendations from '../components/AI/Recommendations'
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, HelpCircle, ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import { useState } from 'react'

function formatWealth(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val}`
}

export default function Dashboard({ userId }) {
  const [holdingsView, setHoldingsView] = useState('all')
  const [showWhyPanel, setShowWhyPanel] = useState(false)
  const [showScoreInfo, setShowScoreInfo] = useState(false)

  const { data: portfolio, isLoading: pLoading } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => getPortfolio(userId),
  })

  const { data: wellness, isLoading: wLoading } = useQuery({
    queryKey: ['wellness', userId],
    queryFn: () => getWellness(userId),
  })

  if (pLoading || wLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Loading your wealth overview...</p>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  const perf = portfolio?.performance || {}

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Welcome back, {portfolio?.name?.split(' ')[0]}</h2>
        <p>Here's your wealth wellness overview for today</p>
      </div>

      {/* Why WealthPulse — collapsible info panel */}
      <div className="card" style={{ marginBottom: 24, padding: showWhyPanel ? '16px 20px' : '10px 20px' }}>
        <button
          onClick={() => setShowWhyPanel(!showWhyPanel)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer', width: '100%', padding: 0,
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          }}
        >
          <HelpCircle size={16} color="var(--accent-blue)" />
          What makes WealthPulse different?
          {showWhyPanel ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
        </button>
        {showWhyPanel && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>
              Traditional platforms track returns. <strong style={{ color: 'var(--text-primary)' }}>WealthPulse measures wealth health</strong> — a holistic view across five dimensions:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { name: 'Diversification', desc: 'Are you spread across asset classes, or concentrated in one bet?', color: '#3b82f6' },
                { name: 'Liquidity', desc: 'Can you access cash when you need it, without selling at a loss?', color: '#10b981' },
                { name: 'Behavioral Resilience', desc: 'Can your portfolio weather volatility without panic selling?', color: '#f59e0b' },
                { name: 'Goal Alignment', desc: 'Are your savings and returns on track to meet your life goals?', color: '#8b5cf6' },
                { name: 'Digital Readiness', desc: 'Do you have appropriate exposure to crypto and tokenised assets?', color: '#ec4899' },
              ].map(d => (
                <div key={d.name} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Unlike Endowus, StashAway, or Syfe — WealthPulse is the only platform that unifies traditional, private, and tokenised assets under a single multi-dimensional wellness score, with AI-powered insights and historical crisis stress testing.
            </p>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card glow-blue">
          <div className="stat-label">Total Wealth</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
            {formatWealth(portfolio?.total_wealth || 0)}
          </div>
          <div className={`stat-change ${perf.day_change_pct >= 0 ? 'positive' : 'negative'}`}>
            {perf.day_change_pct >= 0 ? '+' : ''}{perf.day_change_pct}% today
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Wellness Score</div>
          <div className="stat-value" style={{ color: wellness?.color }}>
            {wellness?.overall_score}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {wellness?.label?.split(' — ')[0]}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">YTD Return</div>
          <div className={`stat-value ${perf.ytd_change_pct >= 0 ? '' : ''}`}
            style={{ color: perf.ytd_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {perf.ytd_change_pct >= 0 ? '+' : ''}{perf.ytd_change_pct}%
          </div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Year to date</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Change</div>
          <div className="stat-value"
            style={{ color: perf.month_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {perf.month_change_pct >= 0 ? '+' : ''}{perf.month_change_pct}%
          </div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>30-day</div>
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>
        {/* Wealth Chart */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <Activity size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
            Wealth History (12 Months)
          </h3>
          <WealthChart data={portfolio?.wealth_history} />
        </div>

        {/* Wellness Score */}
        <div className="card glow-green" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowScoreInfo(true)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Wealth Wellness Score</h3>
            <Info size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ScoreRing score={wellness?.overall_score || 0} color={wellness?.color} />
          </div>
          <p style={{
            textAlign: 'center', fontSize: 13, color: wellness?.color,
            fontWeight: 600, marginBottom: 4
          }}>
            {wellness?.label}
          </p>

          {/* Mini trend */}
          {wellness?.trend && (
            <div style={{ height: 60, marginTop: 12 }}>
              <ResponsiveContainer>
                <LineChart data={wellness.trend}>
                  <Line type="monotone" dataKey="score" stroke={wellness.color} strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 12
                    }}
                    formatter={(v) => [v, 'Score']}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            Click to see how this score is computed
          </div>
        </div>

      </div>

      {/* Score breakdown + Portfolio allocation */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Score Breakdown</h3>
          <ScoreBreakdown subScores={wellness?.sub_scores} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            <BarChart3 size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
            Asset Allocation
          </h3>
          <PortfolioSummary holdings={portfolio?.holdings} totalWealth={portfolio?.total_wealth} />
        </div>
      </div>

      {/* AI Recommendations */}
      <div style={{ marginBottom: 24 }}>
        <Recommendations userId={userId} />
      </div>


      {/* Holdings table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Holdings Detail</h3>
          <div className="tabs">
            {['all', 'equities', 'bonds', 'cash', 'crypto', 'private_assets', 'tokenised_assets'].map(cls => (
              <button
                key={cls}
                className={`tab ${holdingsView === cls ? 'active' : ''}`}
                onClick={() => setHoldingsView(cls)}
              >
                {cls === 'all' ? 'All' : cls === 'private_assets' ? 'Private' : cls === 'tokenised_assets' ? 'Tokenised' : cls.charAt(0).toUpperCase() + cls.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <HoldingsTable holdings={portfolio?.holdings} activeClass={holdingsView} />
      </div>

      {/* Score Methodology Modal */}
      {showScoreInfo && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowScoreInfo(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)', maxWidth: 560, width: '100%',
              maxHeight: '80vh', overflowY: 'auto', padding: 28,
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>How Your Score is Computed</h3>
              <button
                onClick={() => setShowScoreInfo(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              padding: 16, borderRadius: 12, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Formula
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1.8 }}>
                Overall Score =<br />
                &nbsp;&nbsp;Diversification × <strong>0.25</strong><br />
                &nbsp;&nbsp;+ Liquidity × <strong>0.20</strong><br />
                &nbsp;&nbsp;+ Behavioral Resilience × <strong>0.20</strong><br />
                &nbsp;&nbsp;+ Goal Alignment × <strong>0.20</strong><br />
                &nbsp;&nbsp;+ Digital Readiness × <strong>0.15</strong>
              </div>
            </div>

            {/* Sub-score details */}
            {[
              {
                name: 'Diversification', weight: '25%', color: '#3b82f6', key: 'diversification',
                how: 'Measures concentration risk. Penalizes if any single holding exceeds 30% of total wealth, or if any one asset class exceeds 60%.',
              },
              {
                name: 'Liquidity', weight: '20%', color: '#10b981', key: 'liquidity',
                how: 'Assesses cash reserves relative to total wealth. Targets ≥20% cash buffer. Penalizes heavy allocation to illiquid private assets.',
              },
              {
                name: 'Behavioral Resilience', weight: '20%', color: '#f59e0b', key: 'behavioral_resilience',
                how: 'Evaluates how well your portfolio can weather volatility. Factors in overall portfolio volatility (60% weight) and crypto concentration risk (40% weight).',
              },
              {
                name: 'Goal Alignment', weight: '20%', color: '#8b5cf6', key: 'goal_alignment',
                how: 'Checks if your savings rate and expected returns are on track to meet your financial goals. Penalizes return gaps and rewards on-track future value projections.',
              },
              {
                name: 'Digital Readiness', weight: '15%', color: '#ec4899', key: 'digital_readiness',
                how: 'Evaluates exposure to crypto and tokenised assets. Optimal range is 5–20% of portfolio. Too little or too much both reduce the score.',
              },
            ].map(dim => {
              const sub = wellness?.sub_scores?.[dim.key]
              return (
                <div key={dim.key} style={{
                  padding: 14, borderRadius: 12, background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dim.color }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dim.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>({dim.weight})</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: dim.color }}>{sub?.score ?? '—'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
                    {dim.how}
                  </div>
                  {sub?.insight && (
                    <div style={{ fontSize: 12, color: dim.color, fontWeight: 600, fontStyle: 'italic' }}>
                      {sub.insight}
                    </div>
                  )}
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--border)' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: dim.color,
                      width: `${sub?.score ?? 0}%`, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}

            {/* Score ranges */}
            <div style={{
              padding: 14, borderRadius: 12, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', marginTop: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Score Ranges
              </div>
              {[
                { range: '80–100', label: 'Excellent', color: '#10b981' },
                { range: '65–79', label: 'Good', color: '#3b82f6' },
                { range: '50–64', label: 'Fair', color: '#f59e0b' },
                { range: '35–49', label: 'At Risk', color: '#f97316' },
                { range: '0–34', label: 'Critical', color: '#ef4444' },
              ].map(r => (
                <div key={r.range} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 50 }}>{r.range}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
