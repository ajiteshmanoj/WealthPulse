import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { runScenario } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Zap, TrendingDown, TrendingUp, AlertTriangle, Coins, DollarSign } from 'lucide-react'

const SCENARIOS = [
  { type: 'rate_hike', label: 'Interest Rate Hike', icon: TrendingUp, default_mag: 1, unit: '%', color: '#f59e0b' },
  { type: 'market_crash', label: 'Market Crash', icon: TrendingDown, default_mag: 20, unit: '%', color: '#ef4444' },
  { type: 'crypto_rally', label: 'Crypto Rally', icon: Coins, default_mag: 50, unit: '%', color: '#8b5cf6' },
  { type: 'sgd_depreciation', label: 'SGD Depreciation', icon: DollarSign, default_mag: 5, unit: '%', color: '#f97316' },
]

export default function ScenariosPage() {
  const [selected, setSelected] = useState(null)
  const [magnitude, setMagnitude] = useState(0)

  const mutation = useMutation({
    mutationFn: runScenario,
  })

  const handleRun = (scenario) => {
    setSelected(scenario.type)
    setMagnitude(scenario.default_mag)
    mutation.mutate({ scenario_type: scenario.type, magnitude: scenario.default_mag })
  }

  const handleCustomRun = () => {
    if (!selected) return
    mutation.mutate({ scenario_type: selected, magnitude })
  }

  const result = mutation.data

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Scenario Lab</h2>
        <p>Stress-test your portfolio against market events</p>
      </div>

      {/* Scenario selector */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {SCENARIOS.map(s => {
          const Icon = s.icon
          const isActive = selected === s.type
          return (
            <button
              key={s.type}
              className={`card ${isActive ? 'glow-blue' : ''}`}
              style={{
                cursor: 'pointer', textAlign: 'left',
                border: isActive ? `1px solid ${s.color}40` : undefined,
              }}
              onClick={() => handleRun(s)}
            >
              <Icon size={24} color={s.color} style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.label}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Default: {s.type === 'market_crash' ? '-' : '+'}{s.default_mag}{s.unit}
              </p>
            </button>
          )
        })}
      </div>

      {/* Custom magnitude */}
      {selected && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Magnitude (%)
              </label>
              <input
                type="number"
                value={magnitude}
                onChange={(e) => setMagnitude(Number(e.target.value))}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 16px', color: 'var(--text-primary)',
                  fontSize: 16, fontWeight: 600, width: 120, fontFamily: 'inherit',
                }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCustomRun} style={{ marginTop: 20 }}>
              <Zap size={16} /> Run Scenario
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {mutation.isPending && (
        <div className="loading-container"><div className="spinner" /> Running simulation...</div>
      )}

      {result && (
        <div className="animate-in">
          {/* Impact summary */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Portfolio Before</div>
              <div className="stat-value" style={{ fontSize: 24 }}>
                SGD {result.portfolio_before.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Wellness: {result.portfolio_before.wellness_score}
              </div>
            </div>
            <div className="stat-card" style={{ borderColor: result.value_change >= 0 ? '#10b98130' : '#ef444430' }}>
              <div className="stat-label">Impact</div>
              <div className="stat-value" style={{
                fontSize: 24,
                color: result.value_change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {result.value_change >= 0 ? '+' : ''}SGD {result.value_change.toLocaleString()}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, marginTop: 4,
                color: result.value_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {result.value_change_pct >= 0 ? '+' : ''}{result.value_change_pct}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Portfolio After</div>
              <div className="stat-value" style={{ fontSize: 24 }}>
                SGD {result.portfolio_after.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Wellness: {result.portfolio_after.wellness_score} ({result.wellness_impact >= 0 ? '+' : ''}{result.wellness_impact})
              </div>
            </div>
          </div>

          {/* Asset impacts chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Impact by Asset Class</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={result.asset_impacts} layout="vertical" margin={{ left: 120 }}>
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    dataKey="asset_class" type="category"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickFormatter={(v) => v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 10, fontSize: 13
                    }}
                    formatter={(val, name, entry) => [
                      `${val}% (SGD ${entry.payload.value_change.toLocaleString()})`,
                      'Change'
                    ]}
                  />
                  <Bar dataKey="change_pct" radius={[0, 4, 4, 0]}>
                    {result.asset_impacts.map((entry, i) => (
                      <Cell key={i} fill={entry.change_pct >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Narrative */}
          <div className="card" style={{
            background: 'rgba(139, 92, 246, 0.08)',
            borderColor: 'rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={18} color="var(--accent-purple)" />
              <h4 style={{ fontSize: 14, fontWeight: 600 }}>Analysis</h4>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {result.narrative}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
