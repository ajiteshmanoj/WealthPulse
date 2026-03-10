import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getGoal, calculateGoal, analyzeExpenses } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts'
import { Target, Calculator, CheckCircle, AlertTriangle, PiggyBank, Edit3, Clock, TrendingUp } from 'lucide-react'

function formatCurrency(val) {
  if (Math.abs(val) >= 1000000) return `SGD ${(val / 1000000).toFixed(2)}M`
  if (Math.abs(val) >= 1000) return `SGD ${(val / 1000).toFixed(0)}K`
  return `SGD ${Math.round(val)}`
}

function calcFV(pv, pmt, annualRate, years) {
  if (years <= 0) return pv
  const mr = annualRate / 100 / 12
  const m = years * 12
  if (mr === 0) return pv + pmt * m
  return pv * Math.pow(1 + mr, m) + pmt * ((Math.pow(1 + mr, m) - 1) / mr)
}

function calcRequiredMonthly(target, current, annualRate, years) {
  const m = years * 12
  if (m <= 0 || target <= 0) return 0
  const mr = annualRate / 100 / 12
  if (mr === 0) return Math.max(0, (target - current) / m)
  const fvCurrent = current * Math.pow(1 + mr, m)
  const remaining = target - fvCurrent
  if (remaining <= 0) return 0
  return remaining / ((Math.pow(1 + mr, m) - 1) / mr)
}

function calcRequiredReturn(target, current, monthly, years) {
  const m = years * 12
  if (m <= 0 || target <= 0) return 0
  if (current + monthly * m >= target) return 0
  let low = 0, high = 50
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    const mr = mid / 100 / 12
    const fv = current * Math.pow(1 + mr, m) + monthly * ((Math.pow(1 + mr, m) - 1) / mr)
    if (fv < target) low = mid; else high = mid
  }
  return Math.round((low + high) / 2 * 10) / 10
}

const inputStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  width: '100%',
}

export default function GoalsPage({ userId }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [goalName, setGoalName] = useState('')
  const [goalType, setGoalType] = useState('property')
  const [targetAmount, setTargetAmount] = useState(300000)
  const [targetYears, setTargetYears] = useState(5)
  const [currentSavings, setCurrentSavings] = useState(0)
  const [monthlyContribution, setMonthlyContribution] = useState(2000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [recYears, setRecYears] = useState(5)

  const { data: goal, isLoading: goalLoading, isError } = useQuery({
    queryKey: ['goal', userId],
    queryFn: () => getGoal(userId),
    retry: 1,
  })

  const calcMutation = useMutation({ mutationFn: calculateGoal })
  const expMutation = useMutation({ mutationFn: analyzeExpenses })

  useEffect(() => {
    if (goal) {
      setGoalName(goal.goal_name)
      setGoalType(goal.goal_type)
      setTargetAmount(goal.target_amount)
      setTargetYears(goal.target_years)
      setCurrentSavings(goal.current_savings_toward_goal)
      setMonthlyContribution(goal.monthly_contribution)
      setExpectedReturn(goal.expected_return_pct)
      setRecYears(goal.target_years)
    }
  }, [goal])

  const handleCalculate = () => {
    if (targetYears <= 0 || targetAmount <= 0) return
    calcMutation.mutate({
      user_id: userId,
      goal_type: goalType,
      goal_name: goalName,
      target_amount: targetAmount,
      target_years: targetYears,
      current_savings_toward_goal: currentSavings,
      monthly_contribution: monthlyContribution,
      expected_return_pct: expectedReturn,
    })
    setActiveTab('projection')
  }

  const handleExpenses = () => {
    if (!goal) return
    expMutation.mutate({
      user_id: userId,
      monthly_income: goal.monthly_income,
      expenses: goal.expenses,
    })
  }

  const projectedFV = useMemo(() => calcFV(currentSavings, monthlyContribution, expectedReturn, targetYears), [currentSavings, monthlyContribution, expectedReturn, targetYears])
  const progressPct = targetAmount > 0 ? (currentSavings / targetAmount * 100).toFixed(1) : 0
  const onTrack = projectedFV >= targetAmount
  const recMonthlyRequired = useMemo(() => calcRequiredMonthly(targetAmount, currentSavings, expectedReturn, recYears), [targetAmount, currentSavings, expectedReturn, recYears])
  const recReturn = useMemo(() => calcRequiredReturn(targetAmount, currentSavings, monthlyContribution, recYears), [targetAmount, currentSavings, monthlyContribution, recYears])

  const calc = calcMutation.data
  const exp = expMutation.data

  // Loading
  if (goalLoading) {
    return (
      <div>
        <div className="page-header"><h2>Goal Planner</h2></div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  // Error
  if (isError || !goal) {
    return (
      <div>
        <div className="page-header"><h2>Goal Planner</h2></div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <AlertTriangle size={32} color="var(--accent-red)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Failed to load goal data. Make sure the backend is running on port 8000.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Goal Planner</h2>
        <p>Plan, project, and track your financial goals</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'projection' ? 'active' : ''}`} onClick={() => { if (!calc && targetAmount > 0 && targetYears > 0) handleCalculate(); else setActiveTab('projection'); }}>Projection</button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => { setActiveTab('expenses'); if (!exp) handleExpenses(); }}>Expenses</button>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          <div className="card glow-blue" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Target size={24} color="var(--accent-blue)" />
              <div style={{ flex: 1 }}>
                <input value={goalName} onChange={(e) => setGoalName(e.target.value)}
                  style={{ ...inputStyle, fontSize: 18, fontWeight: 700, background: 'transparent', border: '1px solid transparent', padding: '4px 8px' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'transparent'} />
                <select value={goalType} onChange={(e) => setGoalType(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '2px 8px', width: 'auto', cursor: 'pointer' }}>
                  <option value="property">property goal</option>
                  <option value="retirement">retirement goal</option>
                  <option value="education">education goal</option>
                  <option value="emergency">emergency fund</option>
                  <option value="custom">custom goal</option>
                </select>
              </div>
              {onTrack
                ? <span className="badge badge-green" style={{ fontSize: 12 }}><CheckCircle size={12} style={{ marginRight: 4 }} /> On Track</span>
                : <span className="badge badge-red" style={{ fontSize: 12 }}><AlertTriangle size={12} style={{ marginRight: 4 }} /> Off Track</span>}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatCurrency(currentSavings)} saved</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(targetAmount)} target</span>
              </div>
              <div style={{ height: 12, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, progressPct)}%`, background: 'var(--gradient-primary)', borderRadius: 6, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>{progressPct}% complete</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Edit3 size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Edit your goal parameters below — projections update automatically</span>
            </div>

            <div className="grid-4" style={{ gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Amount (SGD)</label>
                <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Time Horizon (years)</label>
                <input type="number" value={targetYears} onChange={(e) => setTargetYears(Number(e.target.value))} style={inputStyle} min={1} max={50} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monthly Contribution (SGD)</label>
                <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Expected Return (% p.a.)</label>
                <input type="number" value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} style={inputStyle} step={0.5} />
              </div>
            </div>

            <div className="grid-4" style={{ gap: 16, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Savings (SGD)</label>
                <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Projected Value</label>
                <div style={{ ...inputStyle, background: 'transparent', border: '1px solid transparent', fontSize: 18, fontWeight: 700, color: onTrack ? 'var(--accent-green)' : 'var(--accent-red)', padding: '6px 12px' }}>
                  {formatCurrency(Math.round(projectedFV))}
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleCalculate}>
            <Calculator size={16} /> Run Full Projection
          </button>
        </div>
      )}

      {/* ===== PROJECTION TAB ===== */}
      {activeTab === 'projection' && (
        <div className="animate-in">
          {/* Your current plan */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Current Plan</h3>
            <div className="grid-4" style={{ gap: 16 }}>
              {[
                ['Target', formatCurrency(targetAmount)],
                ['Monthly Saving', `SGD ${monthlyContribution.toLocaleString()}`],
                ['Time Horizon', `${targetYears} years`],
                ['Expected Return', `${expectedReturn}% p.a.`],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 16px', background: onTrack ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 10, border: `1px solid ${onTrack ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Projected outcome with current plan:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: onTrack ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {formatCurrency(Math.round(projectedFV))} {onTrack ? '(On Track)' : `(Short by ${formatCurrency(Math.round(targetAmount - projectedFV))})`}
              </span>
            </div>
          </div>

          {/* Recommended plan */}
          <div className="card glow-green" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              <TrendingUp size={18} style={{ marginRight: 8, verticalAlign: -3, color: 'var(--accent-green)' }} />
              What It Takes to Reach Your Goal
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Drag the slider to explore different timeframes — savings and returns adjust automatically
            </p>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <Clock size={16} color="var(--accent-blue)" />
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Time Horizon</label>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)', minWidth: 80, textAlign: 'center' }}>{recYears} years</span>
              </div>
              <input type="range" min={1} max={30} value={recYears} onChange={(e) => setRecYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>1 year</span><span>30 years</span>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <div style={{ padding: 24, borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  You Need to Save Per Month
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-green)' }}>SGD {Math.round(recMonthlyRequired).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  {recMonthlyRequired > monthlyContribution
                    ? `SGD ${Math.round(recMonthlyRequired - monthlyContribution).toLocaleString()} more than your current SGD ${monthlyContribution.toLocaleString()}/month`
                    : recMonthlyRequired < monthlyContribution
                    ? `SGD ${Math.round(monthlyContribution - recMonthlyRequired).toLocaleString()} less than your current SGD ${monthlyContribution.toLocaleString()}/month — you're ahead!`
                    : 'Exactly your current contribution — you\'re on track!'}
                </div>
              </div>
              <div style={{ padding: 24, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Return Needed With Your Current Savings
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: recReturn > 12 ? 'var(--accent-red)' : recReturn > 8 ? 'var(--accent-yellow)' : 'var(--accent-blue)' }}>
                  {recReturn}% p.a.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  {recReturn > 12 ? 'Very high risk — consider saving more or extending your timeline'
                    : recReturn > 8 ? 'Aggressive — requires a growth-heavy portfolio'
                    : recReturn > 5 ? 'Moderate — achievable with a balanced portfolio'
                    : recReturn > 0 ? 'Conservative — achievable with low-risk investments'
                    : 'Your savings alone will cover this!'}
                </div>
              </div>
            </div>
          </div>

          {/* Simulation results */}
          {calcMutation.isPending && (
            <div className="loading-container"><div className="spinner" /> Running projection...</div>
          )}

          {calc && (
            <>
              {/* Wealth projection chart — recomputed from slider years */}
              {(() => {
                const chartData = []
                for (let y = 0; y <= recYears; y++) {
                  chartData.push({
                    year: y,
                    value: Math.round(calcFV(currentSavings, monthlyContribution, expectedReturn, y)),
                    contributions_total: Math.round(currentSavings + monthlyContribution * 12 * y),
                  })
                }
                return (
                  <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Growth Over Time</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Blue = projected growth with returns. Green = your contributions only. Yellow = target.</p>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `Year ${v}`} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={50} />
                          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                            formatter={(val, name) => [formatCurrency(val), name === 'value' ? 'Projected Value' : 'Your Contributions']} />
                          <ReferenceLine y={targetAmount} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Target', fill: '#f59e0b', fontSize: 11 }} />
                          <Area type="monotone" dataKey="contributions_total" stroke="#10b981" strokeWidth={1.5} fill="url(#contribGrad)" />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#projGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })()}

              {/* Return scenarios — computed from slider years */}
              {(() => {
                const strategies = [
                  { key: 'conservative', label: 'Safe & Steady (Bonds)', pct: 4 },
                  { key: 'moderate', label: 'Balanced Growth (S&P 500)', pct: 10 },
                  { key: 'aggressive', label: 'High Growth (Tech/Crypto)', pct: 20 },
                ]
                return (
                  <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>What If Your Returns Were Different?</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Same savings over {recYears} years, different portfolio strategies</p>
                    <div className="grid-3">
                      {strategies.map(({ key, label, pct }) => {
                        const fv = calcFV(currentSavings, monthlyContribution, pct, recYears)
                        const meetsGoal = fv >= targetAmount
                        return (
                          <div key={key} style={{
                            padding: 20, borderRadius: 12,
                            background: meetsGoal ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${meetsGoal ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                              {label} ({pct}% p.a.)
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{formatCurrency(fv)}</div>
                            {meetsGoal
                              ? <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}><CheckCircle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Reaches Goal</span>
                              : <span style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600 }}><AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Falls Short</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Milestones */}
              {calc.milestones?.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Milestones Along the Way</h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {calc.milestones.map((m, i) => (
                      <div key={i} style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center', minWidth: 120 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Year {m.year}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(m.value)}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button className="btn btn-outline" onClick={() => setActiveTab('overview')} style={{ marginTop: 8 }}>
            <Edit3 size={14} /> Edit Goal Parameters
          </button>
        </div>
      )}

      {/* ===== EXPENSES TAB ===== */}
      {activeTab === 'expenses' && (
        <div>
          {expMutation.isPending && (
            <div className="loading-container"><div className="spinner" /> Analyzing expenses...</div>
          )}
          {exp && (
            <div className="animate-in">
              <div className="grid-4" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-label">Monthly Income</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>SGD {goal?.monthly_income?.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Expenses</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>SGD {exp.total_expenses.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Monthly Surplus</div>
                  <div className="stat-value" style={{ fontSize: 22, color: exp.monthly_surplus >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    SGD {exp.monthly_surplus.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Investable Surplus</div>
                  <div className="stat-value" style={{ fontSize: 22, color: 'var(--accent-blue)' }}>SGD {exp.investable_surplus.toLocaleString()}</div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={Object.entries(exp.expense_breakdown).map(([key, val]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), amount: val.amount, pct: val.pct_of_income }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} width={60} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                        formatter={(val) => [`SGD ${val.toLocaleString()}`, 'Amount']} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {Object.keys(exp.expense_breakdown).map((_, i) => (
                          <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444'][i % 7]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {exp.savings_gap > 0 && (
                <div className="card" style={{ marginBottom: 24, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <AlertTriangle size={18} color="var(--accent-red)" />
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-red)' }}>Savings Gap Detected</h4>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    You need an additional <strong>SGD {exp.savings_gap.toLocaleString()}</strong>/month to meet your goal contribution target.
                  </p>
                </div>
              )}

              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  <PiggyBank size={18} style={{ marginRight: 8, verticalAlign: -3 }} /> Suggestions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exp.suggestions.map((s, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
