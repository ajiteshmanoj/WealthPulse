import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getGoal, calculateGoal, analyzeExpenses } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts'
import { Target, Calculator, TrendingUp, CheckCircle, AlertTriangle, DollarSign, PiggyBank } from 'lucide-react'

function formatCurrency(val) {
  if (val >= 1000000) return `SGD ${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `SGD ${(val / 1000).toFixed(0)}K`
  return `SGD ${val}`
}

export default function GoalsPage({ userId }) {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ['goal', userId],
    queryFn: () => getGoal(userId),
  })

  const calcMutation = useMutation({ mutationFn: calculateGoal })
  const expMutation = useMutation({ mutationFn: analyzeExpenses })

  const handleCalculate = () => {
    if (!goal) return
    calcMutation.mutate({
      user_id: userId,
      goal_type: goal.goal_type,
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      target_years: goal.target_years,
      current_savings_toward_goal: goal.current_savings_toward_goal,
      monthly_contribution: goal.monthly_contribution,
      expected_return_pct: goal.expected_return_pct,
    })
  }

  const handleExpenses = () => {
    if (!goal) return
    expMutation.mutate({
      user_id: userId,
      monthly_income: goal.monthly_income,
      expenses: goal.expenses,
    })
  }

  if (goalLoading) {
    return (
      <div>
        <div className="page-header"><h2>Goal Planner</h2></div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  const calc = calcMutation.data
  const exp = expMutation.data

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Goal Planner</h2>
        <p>Plan, project, and track your financial goals</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'projection' ? 'active' : ''}`} onClick={() => { setActiveTab('projection'); if (!calc) handleCalculate() }}>Projection</button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => { setActiveTab('expenses'); if (!exp) handleExpenses() }}>Expenses</button>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && goal && (
        <div>
          <div className="card glow-blue" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Target size={24} color="var(--accent-blue)" />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{goal.goal_name}</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{goal.goal_type} goal</span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {goal.on_track ? (
                  <span className="badge badge-green" style={{ fontSize: 12 }}>
                    <CheckCircle size={12} style={{ marginRight: 4 }} /> On Track
                  </span>
                ) : (
                  <span className="badge badge-red" style={{ fontSize: 12 }}>
                    <AlertTriangle size={12} style={{ marginRight: 4 }} /> Off Track
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatCurrency(goal.current_savings_toward_goal)} saved
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {formatCurrency(goal.target_amount)} target
                </span>
              </div>
              <div style={{
                height: 12, background: 'var(--bg-secondary)',
                borderRadius: 6, overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, goal.progress_pct)}%`,
                  background: 'var(--gradient-primary)', borderRadius: 6,
                  transition: 'width 1s ease'
                }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>
                {goal.progress_pct}% complete
              </div>
            </div>

            <div className="grid-4">
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Contribution</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>SGD {goal.monthly_contribution.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Time Horizon</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{goal.target_years} years</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Expected Return</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{goal.expected_return_pct}% p.a.</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Projected Value</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: goal.on_track ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {formatCurrency(goal.projected_final_value)}
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleCalculate} style={{ marginBottom: 16 }}>
            <Calculator size={16} /> Run Full Projection
          </button>
        </div>
      )}

      {/* Projection tab */}
      {activeTab === 'projection' && (
        <div>
          {calcMutation.isPending && (
            <div className="loading-container"><div className="spinner" /> Running Monte Carlo simulation...</div>
          )}
          {calc && (
            <div className="animate-in">
              {/* Key metrics */}
              <div className="grid-4" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-label">Monthly Required</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>SGD {Math.round(calc.monthly_required).toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Probability of Success</div>
                  <div className="stat-value" style={{
                    fontSize: 22,
                    color: calc.probability_of_success >= 70 ? 'var(--accent-green)' : calc.probability_of_success >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                  }}>
                    {calc.probability_of_success}%
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Shortfall / Surplus</div>
                  <div className="stat-value" style={{
                    fontSize: 22,
                    color: calc.shortfall_or_surplus >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}>
                    {calc.shortfall_or_surplus >= 0 ? '+' : ''}{formatCurrency(calc.shortfall_or_surplus)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Required Return</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>{calc.required_return_to_meet_goal}%</div>
                </div>
              </div>

              {/* Monte Carlo */}
              {calc.monte_carlo && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Monte Carlo Simulation (1,000 runs)
                  </h3>
                  <div className="grid-3">
                    <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600, marginBottom: 4 }}>P10 (Pessimistic)</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(calc.monte_carlo.p10)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 4 }}>P50 (Median)</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(calc.monte_carlo.p50)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>P90 (Optimistic)</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(calc.monte_carlo.p90)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wealth projection chart */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Wealth Projection</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={calc.wealth_projection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `Y${v}`} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={50} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                        formatter={(val, name) => [formatCurrency(val), name === 'value' ? 'Projected' : 'Contributions']}
                      />
                      <ReferenceLine y={goal?.target_amount} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Target', fill: '#f59e0b', fontSize: 11 }} />
                      <Area type="monotone" dataKey="contributions_total" stroke="#10b981" strokeWidth={1.5} fill="url(#contribGrad)" />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#projGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scenarios comparison */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Return Scenarios</h3>
                <div className="grid-3">
                  {Object.entries(calc.scenarios).map(([key, s]) => (
                    <div key={key} style={{
                      padding: 20, borderRadius: 12,
                      background: s.meets_goal ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${s.meets_goal ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', marginBottom: 8, color: 'var(--text-secondary)' }}>
                        {key} ({s.return_pct}% p.a.)
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{formatCurrency(s.final_value)}</div>
                      {s.meets_goal ? (
                        <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>
                          <CheckCircle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Meets Goal
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600 }}>
                          <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Falls Short
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {calc.milestones && calc.milestones.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Milestones</h3>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {calc.milestones.map((m, i) => (
                      <div key={i} style={{
                        padding: '12px 20px', borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        textAlign: 'center', minWidth: 120
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Year {m.year}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(m.value)}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expenses tab */}
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
                  <div className="stat-value" style={{
                    fontSize: 22,
                    color: exp.monthly_surplus >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}>
                    SGD {exp.monthly_surplus.toLocaleString()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Investable Surplus</div>
                  <div className="stat-value" style={{ fontSize: 22, color: 'var(--accent-blue)' }}>
                    SGD {exp.investable_surplus.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Expense breakdown chart */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={Object.entries(exp.expense_breakdown).map(([key, val]) => ({
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        amount: val.amount,
                        pct: val.pct_of_income,
                      }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} width={60} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                        formatter={(val, name) => [`SGD ${val.toLocaleString()} (${Object.values(exp.expense_breakdown).find(v => v.amount === val)?.pct_of_income}%)`, name]}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {Object.keys(exp.expense_breakdown).map((_, i) => (
                          <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444'][i % 7]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Savings gap + suggestions */}
              {exp.savings_gap > 0 && (
                <div className="card" style={{
                  marginBottom: 24, background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.2)'
                }}>
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
                  <PiggyBank size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                  Suggestions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exp.suggestions.map((s, i) => (
                    <div key={i} style={{
                      padding: 14, borderRadius: 10,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6
                    }}>
                      {s}
                    </div>
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
