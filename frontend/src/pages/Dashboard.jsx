import { useQuery } from '@tanstack/react-query'
import { getPortfolio, getWellness } from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ScoreRing from '../components/WellnessScore/ScoreRing'
import ScoreBreakdown from '../components/WellnessScore/ScoreBreakdown'
import PortfolioSummary from '../components/Portfolio/PortfolioSummary'
import HoldingsTable from '../components/Portfolio/HoldingsTable'
import WealthChart from '../components/Portfolio/WealthChart'
import Recommendations from '../components/AI/Recommendations'
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { useState } from 'react'

function formatWealth(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val}`
}

export default function Dashboard({ userId }) {
  const [holdingsView, setHoldingsView] = useState('all')

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
        <div className="card glow-green">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Wealth Wellness Score</h3>
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
    </div>
  )
}
