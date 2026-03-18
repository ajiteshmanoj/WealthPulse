import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPortfolio, runWhatIf, getRebalancePlan } from '../services/api'
import { Sliders, RotateCcw, TrendingUp, TrendingDown, Lightbulb, ClipboardList, ArrowRight, Info, Clock, Copy, Check, Loader2, ArrowDown, ArrowUp } from 'lucide-react'

const ASSET_CLASSES = [
  { key: 'equities', label: 'Equities', color: '#3b82f6' },
  { key: 'bonds', label: 'Bonds', color: '#10b981' },
  { key: 'cash', label: 'Cash', color: '#f59e0b' },
  { key: 'crypto', label: 'Crypto', color: '#8b5cf6' },
  { key: 'private_assets', label: 'Private Assets', color: '#ec4899' },
  { key: 'tokenised_assets', label: 'Tokenised Assets', color: '#06b6d4' },
]

const DIMENSIONS = [
  { key: 'diversification', label: 'Diversification' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'behavioral_resilience', label: 'Behavioral Resilience' },
  { key: 'goal_alignment', label: 'Goal Alignment' },
  { key: 'digital_readiness', label: 'Digital Readiness' },
]

function getScoreColor(score) {
  if (score >= 80) return 'var(--accent-green)'
  if (score >= 60) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

function formatSGD(val) {
  return `SGD ${val.toLocaleString()}`
}

function extractAllocations(portfolio) {
  if (!portfolio?.holdings) return null
  const totals = {}
  let totalValue = portfolio.total_wealth || 0
  if (totalValue === 0) totalValue = 1

  ASSET_CLASSES.forEach(ac => { totals[ac.key] = 0 })
  // holdings is a dict keyed by asset class, each value is an array of items
  for (const [cls, items] of Object.entries(portfolio.holdings)) {
    if (totals[cls] !== undefined && Array.isArray(items)) {
      for (const item of items) {
        totals[cls] += item.value || 0
      }
    }
  }

  const alloc = {}
  ASSET_CLASSES.forEach(ac => {
    alloc[ac.key] = Math.round((totals[ac.key] / totalValue) * 100)
  })

  // Ensure they sum to 100
  const sum = Object.values(alloc).reduce((a, b) => a + b, 0)
  if (sum !== 100 && sum > 0) {
    const diff = 100 - sum
    // Add the rounding difference to the largest allocation
    const largest = ASSET_CLASSES.reduce((a, b) => alloc[a.key] >= alloc[b.key] ? a : b)
    alloc[largest.key] += diff
  }

  return alloc
}

export default function WhatIfPage({ userId }) {
  const [allocations, setAllocations] = useState(null)
  const [currentAllocations, setCurrentAllocations] = useState(null)
  const [rebalancePlan, setRebalancePlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState(null)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef(null)

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => getPortfolio(userId),
  })

  const mutation = useMutation({
    mutationFn: runWhatIf,
  })

  // Initialize allocations from portfolio data
  useEffect(() => {
    if (portfolio && !currentAllocations) {
      const alloc = extractAllocations(portfolio)
      if (alloc) {
        setCurrentAllocations(alloc)
        setAllocations({ ...alloc })
      }
    }
  }, [portfolio, currentAllocations])

  // Clear plan when user switches profiles
  useEffect(() => {
    setCurrentAllocations(null)
    setAllocations(null)
    setRebalancePlan(null)
    setPlanError(null)
    mutation.reset()
  }, [userId])

  // Check if allocations differ from current
  const hasChanges = allocations && currentAllocations && ASSET_CLASSES.some(
    ac => Math.abs(allocations[ac.key] - currentAllocations[ac.key]) > 0.5
  )

  // Debounced what-if call — use ref to avoid stale closure
  const mutationRef = useRef(mutation)
  mutationRef.current = mutation
  const triggerWhatIf = useCallback((alloc) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      mutationRef.current.mutate({
        user_id: userId,
        allocations: alloc,
      })
    }, 300)
  }, [userId])

  const handleSliderChange = (key, newValue) => {
    // Clear plan when sliders move
    setRebalancePlan(null)
    setPlanError(null)

    setAllocations(prev => {
      const clamped = Math.max(0, Math.min(100, newValue))
      const remaining = 100 - clamped
      const others = ASSET_CLASSES.filter(ac => ac.key !== key)
      const othersSum = others.reduce((sum, ac) => sum + prev[ac.key], 0)

      const next = { [key]: clamped }

      if (othersSum === 0) {
        // All others are 0 — distribute remaining evenly
        others.forEach((ac, i) => {
          next[ac.key] = i === 0 ? remaining : 0
        })
      } else {
        // Scale others proportionally to fill remaining
        let allocated = 0
        others.forEach((ac, i) => {
          if (i === others.length - 1) {
            next[ac.key] = remaining - allocated
          } else {
            const scaled = Math.round((prev[ac.key] / othersSum) * remaining)
            next[ac.key] = scaled
            allocated += scaled
          }
        })
      }

      triggerWhatIf(next)
      return next
    })
  }

  const handleReset = () => {
    if (currentAllocations) {
      setAllocations({ ...currentAllocations })
      setRebalancePlan(null)
      setPlanError(null)
      mutation.reset()
    }
  }

  const handleGeneratePlan = async () => {
    if (!allocations || !hasChanges) return
    setPlanLoading(true)
    setPlanError(null)
    setRebalancePlan(null)
    try {
      const result = await getRebalancePlan(userId, allocations)
      setRebalancePlan(result)
    } catch (err) {
      setPlanError(err.response?.data?.detail || err.message || 'Failed to generate plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const handleCopyPlan = () => {
    if (!rebalancePlan?.plan) return
    const plan = rebalancePlan.plan
    const userName = portfolio?.name || userId
    let text = `WealthPulse Rebalancing Plan — ${userName}\n${'='.repeat(45)}\n\n`

    for (const step of plan.steps) {
      const actionLabel = step.action.toUpperCase()
      text += `${actionLabel} ${step.asset_class}: ${formatSGD(step.amount_sgd)} (${step.current_pct}% → ${step.proposed_pct}%)\n`
      for (const h of step.holdings_breakdown) {
        text += `  - ${h.action === 'sell' ? 'Sell' : 'Buy'} ${h.name}: ${formatSGD(h.amount_sgd)}\n`
      }
      text += '\n'
    }

    text += `Summary: ${formatSGD(plan.summary.total_sells_sgd)} sells / ${formatSGD(plan.summary.total_buys_sgd)} buys\n`
    text += `Est. Transaction Costs: ${formatSGD(plan.summary.estimated_costs_sgd)} (${plan.summary.cost_basis})\n`
    text += `Wellness Score Impact: ${plan.summary.current_wellness_score} → ${plan.summary.proposed_wellness_score} (${plan.summary.wellness_delta > 0 ? '+' : ''}${plan.summary.wellness_delta} pts)\n\n`
    text += `Timeline: ${plan.execution_notes.timeline}\n\n`
    text += `Disclaimer: ${plan.disclaimer}\n`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>What-If Portfolio Editor</h2>
          <p>Loading your portfolio data...</p>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  if (!allocations || !currentAllocations) {
    return (
      <div>
        <div className="page-header">
          <h2>What-If Portfolio Editor</h2>
          <p>Unable to load portfolio allocations.</p>
        </div>
      </div>
    )
  }

  const total = ASSET_CLASSES.reduce((sum, ac) => sum + allocations[ac.key], 0)
  const result = mutation.data
  const plan = rebalancePlan?.plan

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>What-If Portfolio Editor</h2>
        <p>Adjust your allocation and see the impact on your Wellness Score</p>
      </div>

      {/* Current Allocation Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {ASSET_CLASSES.map(ac => (
          <div className="stat-card" key={ac.key}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ac.color, display: 'inline-block', flexShrink: 0,
              }} />
              {ac.label}
            </div>
            <div className="stat-value" style={{ color: ac.color, fontSize: 22 }}>
              {currentAllocations[ac.key]}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Current allocation</div>
          </div>
        ))}
      </div>

      {/* Main editor grid */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Slider Panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={18} color="var(--accent-blue)" />
              Allocation Sliders
            </h3>
            <button
              className="btn"
              onClick={handleReset}
              style={{
                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, padding: '6px 12px', cursor: 'pointer', borderRadius: 8,
                fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={13} /> Reset to Current
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {ASSET_CLASSES.map(ac => (
              <div key={ac.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: ac.color, display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ac.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: ac.color,
                    minWidth: 42, textAlign: 'right',
                  }}>
                    {allocations[ac.key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={allocations[ac.key]}
                  onChange={(e) => handleSliderChange(ac.key, Number(e.target.value))}
                  style={{
                    width: '100%', height: 6, cursor: 'pointer',
                    accentColor: ac.color,
                    background: `linear-gradient(to right, ${ac.color} ${allocations[ac.key]}%, var(--bg-secondary) ${allocations[ac.key]}%)`,
                    borderRadius: 3,
                    appearance: 'auto',
                    WebkitAppearance: 'auto',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div style={{
            marginTop: 20, padding: '10px 16px', borderRadius: 8,
            background: total === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${total === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{
              fontSize: 16, fontWeight: 700,
              color: total === 100 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {total}%
            </span>
          </div>
        </div>

        {/* Before / After Comparison */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Score Impact</h3>

          {mutation.isPending && (
            <div className="loading-container" style={{ padding: '40px 0' }}>
              <div className="spinner" /> Calculating...
            </div>
          )}

          {!result && !mutation.isPending && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13,
              textAlign: 'center', lineHeight: 1.7,
            }}>
              Drag a slider to see how allocation changes affect your Wellness Score.
            </div>
          )}

          {result && !mutation.isPending && (
            <div>
              {/* Big scores comparison */}
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: 24, marginBottom: 24,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Current
                  </div>
                  <div style={{
                    fontSize: 40, fontWeight: 800,
                    color: getScoreColor(result.current_score),
                  }}>
                    {result.current_score}
                  </div>
                </div>

                <div style={{ fontSize: 24, color: 'var(--text-muted)' }}>→</div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Proposed
                  </div>
                  <div style={{
                    fontSize: 40, fontWeight: 800,
                    color: getScoreColor(result.new_score),
                  }}>
                    {result.new_score}
                  </div>
                </div>

                {/* Delta badge */}
                <div style={{ alignSelf: 'center' }}>
                  {result.new_score - result.current_score !== 0 && (
                    <span className={`badge ${result.new_score >= result.current_score ? 'badge-green' : 'badge-red'}`}
                      style={{ fontSize: 14, fontWeight: 700, padding: '4px 12px' }}>
                      {result.new_score > result.current_score ? '+' : ''}{result.new_score - result.current_score}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-score breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DIMENSIONS.map(dim => {
                  const current = result.current_sub_scores?.[dim.key] ?? 0
                  const proposed = result.new_sub_scores?.[dim.key] ?? 0
                  const delta = proposed - current
                  return (
                    <div key={dim.key} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {dim.label}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                        }}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Current bar */}
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${current}%`, height: '100%',
                            background: 'var(--text-muted)', borderRadius: 3,
                            transition: 'width 0.3s ease',
                            opacity: 0.5,
                          }} />
                        </div>
                        {/* Proposed bar */}
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${proposed}%`, height: '100%',
                            background: delta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Current: {current}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Proposed: {proposed}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Allocation Comparison — stacked horizontal bars */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Allocation Comparison</h3>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {ASSET_CLASSES.map(ac => (
            <div key={ac.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ac.color, display: 'inline-block' }} />
              {ac.label}
            </div>
          ))}
        </div>

        {/* Current bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Current
          </div>
          <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {ASSET_CLASSES.map(ac => (
              currentAllocations[ac.key] > 0 && (
                <div
                  key={ac.key}
                  title={`${ac.label}: ${currentAllocations[ac.key]}%`}
                  style={{
                    width: `${currentAllocations[ac.key]}%`,
                    background: ac.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    transition: 'width 0.3s ease',
                    minWidth: currentAllocations[ac.key] >= 5 ? 'auto' : 0,
                    overflow: 'hidden',
                  }}
                >
                  {currentAllocations[ac.key] >= 8 ? `${currentAllocations[ac.key]}%` : ''}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Proposed bar */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Proposed
          </div>
          <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {ASSET_CLASSES.map(ac => (
              allocations[ac.key] > 0 && (
                <div
                  key={ac.key}
                  title={`${ac.label}: ${allocations[ac.key]}%`}
                  style={{
                    width: `${allocations[ac.key]}%`,
                    background: ac.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    transition: 'width 0.3s ease',
                    minWidth: allocations[ac.key] >= 5 ? 'auto' : 0,
                    overflow: 'hidden',
                  }}
                >
                  {allocations[ac.key] >= 8 ? `${allocations[ac.key]}%` : ''}
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Insight text */}
      {result?.insight && (
        <div className="card" style={{
          background: 'rgba(59, 130, 246, 0.08)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Lightbulb size={18} color="var(--accent-blue)" />
            <h4 style={{ fontSize: 14, fontWeight: 600 }}>Insight</h4>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {result.insight}
          </p>
        </div>
      )}

      {/* Generate Rebalancing Plan Button */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleGeneratePlan}
          disabled={!hasChanges || planLoading}
          style={{
            padding: '12px 28px', fontSize: 15, gap: 8,
            opacity: !hasChanges ? 0.4 : 1,
            cursor: !hasChanges ? 'not-allowed' : 'pointer',
          }}
        >
          {planLoading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Generating Plan...
            </>
          ) : (
            <>
              <ClipboardList size={18} />
              Generate Rebalancing Plan
            </>
          )}
        </button>
      </div>

      {/* Plan Error */}
      {planError && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <p style={{ fontSize: 13, color: 'var(--accent-red)' }}>{planError}</p>
        </div>
      )}

      {/* Rebalancing Plan */}
      {plan && (
        <div className="animate-in">
          {/* Summary Stats */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} color="var(--accent-blue)" />
                Rebalancing Plan
              </h3>
              <button
                className="btn btn-outline"
                onClick={handleCopyPlan}
                style={{ fontSize: 12, padding: '7px 14px', gap: 6 }}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Plan</>}
              </button>
            </div>

            <div className="grid-4" style={{ gap: 12 }}>
              <div className="stat-card">
                <div className="stat-label">Total Sells</div>
                <div className="stat-value" style={{ color: 'var(--accent-red)', fontSize: 18 }}>
                  {formatSGD(plan.summary.total_sells_sgd)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Buys</div>
                <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: 18 }}>
                  {formatSGD(plan.summary.total_buys_sgd)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Est. Costs</div>
                <div className="stat-value" style={{ color: 'var(--accent-yellow)', fontSize: 18 }}>
                  {formatSGD(plan.summary.estimated_costs_sgd)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>({plan.summary.cost_basis})</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Wellness Impact</div>
                <div className="stat-value" style={{
                  color: plan.summary.wellness_delta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  fontSize: 18,
                }}>
                  {plan.summary.wellness_delta > 0 ? '+' : ''}{plan.summary.wellness_delta} pts
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {plan.summary.current_wellness_score} → {plan.summary.proposed_wellness_score}
                </div>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {plan.steps.map((step, idx) => {
              const isSell = step.action === 'sell'
              const prevStep = idx > 0 ? plan.steps[idx - 1] : null
              const showDivider = prevStep && prevStep.action === 'sell' && step.action === 'buy'

              return (
                <div key={idx}>
                  {showDivider && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 20px',
                      color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span>Buy Orders</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  {idx === 0 && isSell && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                      color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span>Sell Orders</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  {idx === 0 && !isSell && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                      color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span>Buy Orders</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}

                  <div className="card" style={{
                    padding: 16,
                    borderColor: isSell ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  }}>
                    {/* Step Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`badge ${isSell ? 'badge-red' : 'badge-green'}`} style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', textTransform: 'uppercase',
                        }}>
                          {isSell ? <ArrowDown size={11} style={{ marginRight: 4 }} /> : <ArrowUp size={11} style={{ marginRight: 4 }} />}
                          {step.action}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{step.asset_class}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {step.current_pct}% → {step.proposed_pct}%
                        </span>
                      </div>
                      <span style={{
                        fontSize: 16, fontWeight: 700,
                        color: isSell ? 'var(--accent-red)' : 'var(--accent-green)',
                      }}>
                        {formatSGD(step.amount_sgd)}
                      </span>
                    </div>

                    {/* Holdings Breakdown */}
                    <div style={{
                      background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden',
                      border: '1px solid var(--border)',
                    }}>
                      {step.holdings_breakdown.map((holding, hIdx) => (
                        <div key={hIdx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: hIdx < step.holdings_breakdown.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: isSell ? 'var(--accent-red)' : 'var(--accent-green)',
                              flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{holding.name}</span>
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: isSell ? 'var(--accent-red)' : 'var(--accent-green)',
                          }}>
                            {formatSGD(holding.amount_sgd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Execution Notes */}
          <div className="card" style={{
            marginBottom: 20, background: 'rgba(59, 130, 246, 0.06)',
            borderColor: 'rgba(59, 130, 246, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={16} color="var(--accent-blue)" />
              <h4 style={{ fontSize: 14, fontWeight: 600 }}>Execution Notes</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 70, flexShrink: 0 }}>Timeline:</span>
                <span>{plan.execution_notes.timeline}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 70, flexShrink: 0 }}>Priority:</span>
                <span>{plan.execution_notes.priority_order}</span>
              </div>
              {plan.execution_notes.considerations.length > 0 && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Considerations:</span>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {plan.execution_notes.considerations.map((c, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic',
            lineHeight: 1.6, marginBottom: 24, padding: '0 4px',
          }}>
            {plan.disclaimer}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
