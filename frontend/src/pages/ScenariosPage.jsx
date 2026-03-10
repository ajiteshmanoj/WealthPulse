import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { runScenario, getHistoricalCrises } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Zap, TrendingDown, TrendingUp, AlertTriangle, Coins, DollarSign, Clock, History, ShieldAlert } from 'lucide-react'

const SCENARIOS = [
  { type: 'rate_hike', label: 'Interest Rate Hike', icon: TrendingUp, default_mag: 1, unit: '%', color: '#f59e0b' },
  { type: 'market_crash', label: 'Market Crash', icon: TrendingDown, default_mag: 20, unit: '%', color: '#ef4444' },
  { type: 'crypto_rally', label: 'Crypto Rally', icon: Coins, default_mag: 50, unit: '%', color: '#8b5cf6' },
  { type: 'sgd_depreciation', label: 'SGD Depreciation', icon: DollarSign, default_mag: 5, unit: '%', color: '#f97316' },
]

const CRISIS_COLORS = {
  gfc_2008: '#ef4444',
  covid_2020: '#f59e0b',
  dotcom_2000: '#8b5cf6',
  euro_debt_2011: '#3b82f6',
  china_2015: '#f97316',
  covid_inflation_2022: '#ec4899',
}

const CRISIS_ICONS = {
  gfc_2008: ShieldAlert,
  covid_2020: AlertTriangle,
  dotcom_2000: TrendingDown,
  euro_debt_2011: DollarSign,
  china_2015: TrendingDown,
  covid_inflation_2022: TrendingUp,
}

export default function ScenariosPage({ userId }) {
  const [selected, setSelected] = useState(null)
  const [magnitude, setMagnitude] = useState(0)
  const [activeTab, setActiveTab] = useState('custom') // 'custom' | 'historical'

  const { data: crisesData } = useQuery({
    queryKey: ['historical-crises'],
    queryFn: getHistoricalCrises,
  })

  const mutation = useMutation({
    mutationFn: runScenario,
  })

  const handleRun = (scenario) => {
    setSelected(scenario.type)
    setMagnitude(scenario.default_mag)
    mutation.mutate({ scenario_type: scenario.type, magnitude: scenario.default_mag, user_id: userId })
  }

  const handleCustomRun = () => {
    if (!selected) return
    mutation.mutate({ scenario_type: selected, magnitude, user_id: userId })
  }

  const handleCrisisRun = (crisisType) => {
    setSelected(crisisType)
    mutation.mutate({ scenario_type: crisisType, user_id: userId })
  }

  const result = mutation.data
  const crises = crisesData?.crises || []

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Scenario Lab</h2>
        <p>Stress-test your portfolio against market events</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${activeTab === 'custom' ? 'btn-primary' : ''}`}
          style={activeTab !== 'custom' ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
          onClick={() => { setActiveTab('custom'); setSelected(null); mutation.reset() }}
        >
          <Zap size={14} /> Custom Scenarios
        </button>
        <button
          className={`btn ${activeTab === 'historical' ? 'btn-primary' : ''}`}
          style={activeTab !== 'historical' ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
          onClick={() => { setActiveTab('historical'); setSelected(null); mutation.reset() }}
        >
          <History size={14} /> Historical Crises
        </button>
      </div>

      {/* === CUSTOM SCENARIOS TAB === */}
      {activeTab === 'custom' && (
        <>
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
                  <Icon size={28} color={s.color} style={{ marginBottom: 12 }} />
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: s.color }}>{s.label}</h4>
                  <p style={{ fontSize: 12, color: s.color, opacity: 0.7, fontWeight: 500 }}>
                    Default: {s.type === 'market_crash' ? '-' : '+'}{s.default_mag}{s.unit}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Custom magnitude */}
          {selected && SCENARIOS.some(s => s.type === selected) && (
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
        </>
      )}

      {/* === HISTORICAL CRISES TAB === */}
      {activeTab === 'historical' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {crises.map(crisis => {
              const color = CRISIS_COLORS[crisis.type] || '#64748b'
              const Icon = CRISIS_ICONS[crisis.type] || AlertTriangle
              const isActive = selected === crisis.type
              return (
                <button
                  key={crisis.type}
                  className="card"
                  style={{
                    cursor: 'pointer', textAlign: 'left', padding: '20px 24px',
                    border: isActive ? `1px solid ${color}60` : '1px solid var(--border)',
                    background: isActive ? `${color}10` : undefined,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleCrisisRun(crisis.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={22} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color }}>{crisis.name}</h4>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 6,
                          background: `${color}20`, color, fontWeight: 600,
                        }}>
                          {crisis.period}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                        {crisis.description}
                      </p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <Clock size={11} /> Duration: {crisis.duration_months} months
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <TrendingUp size={11} /> Recovery: ~{crisis.recovery_years} year{crisis.recovery_years !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px', borderRadius: 8, background: `${color}15`,
                      color, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center',
                    }}>
                      {isActive && mutation.isPending ? 'Running...' : 'Simulate'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* === RESULTS (shared) === */}
      {mutation.isPending && (
        <div className="loading-container"><div className="spinner" /> Running simulation...</div>
      )}

      {result && (
        <div className="animate-in">
          {/* Historical crisis header */}
          {result.is_historical && (
            <div className="card" style={{
              marginBottom: 24, padding: '16px 24px',
              background: `${CRISIS_COLORS[result.scenario] || '#64748b'}10`,
              borderColor: `${CRISIS_COLORS[result.scenario] || '#64748b'}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: CRISIS_COLORS[result.scenario] || '#64748b' }}>
                    {result.crisis_name}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.crisis_period}</span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Duration</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{result.duration_months}mo</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Recovery</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>~{result.recovery_years}yr</div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.asset_impacts.map((entry) => {
                const ASSET_COLORS = {
                  equities: '#3b82f6', bonds: '#10b981', cash: '#f59e0b',
                  crypto: '#8b5cf6', private_assets: '#ec4899', tokenised_assets: '#06b6d4',
                }
                const color = ASSET_COLORS[entry.asset_class] || '#64748b'
                const pct = entry.change_pct
                const absPct = Math.abs(pct)
                const maxPct = Math.max(...result.asset_impacts.map(e => Math.abs(e.change_pct)), 1)
                const barWidth = (absPct / maxPct) * 100
                const label = entry.asset_class.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())

                return (
                  <div key={entry.asset_class} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 120, fontSize: 12, fontWeight: 600, color, textAlign: 'right', flexShrink: 0 }}>
                      {label}
                    </div>
                    <div style={{ flex: 1, height: 32, background: 'var(--bg-secondary)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                      {absPct > 0 && (
                        <div style={{
                          position: 'absolute', top: 0, [pct >= 0 ? 'left' : 'right']: 0,
                          width: `${Math.max(barWidth, 3)}%`, height: '100%',
                          background: pct > 0 ? '#10b981' : '#ef4444',
                          borderRadius: 6, transition: 'width 0.5s ease',
                          opacity: 0.85,
                        }} />
                      )}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        color: pct === 0 ? 'var(--text-muted)' : pct > 0 ? '#10b981' : '#fff',
                      }}>
                        {pct === 0 ? 'No Impact' : `${pct > 0 ? '+' : ''}${pct}% (SGD ${entry.value_change.toLocaleString()})`}
                      </div>
                    </div>
                  </div>
                )
              })}
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
