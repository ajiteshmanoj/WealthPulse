import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTaxData } from '../services/api'
import {
  TrendingUp, TrendingDown, DollarSign, Scissors, Lightbulb,
  AlertTriangle, ArrowDownRight, ArrowUpRight, Shield, PiggyBank,
  Building2, Clock, ChevronDown, ChevronUp, Globe, Landmark, Info
} from 'lucide-react'

function formatCurrency(val) {
  return `SGD ${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatSignedCurrency(val) {
  const prefix = val >= 0 ? '+' : '-'
  return `${prefix}SGD ${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const assetClassColors = {
  equities: '#3b82f6',
  bonds: '#10b981',
  cash: '#f59e0b',
  crypto: '#8b5cf6',
  private_assets: '#ec4899',
  tokenised_assets: '#06b6d4',
}

function getAssetColor(assetClass) {
  if (!assetClass) return '#64748b'
  return assetClassColors[assetClass.toLowerCase()] || '#64748b'
}

function formatHoldingPeriod(months) {
  if (!months && months !== 0) return '-'
  if (months < 1) return '<1 mo'
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years}y`
  return `${years}y ${rem}mo`
}

const priorityStyles = {
  high: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444' },
  medium: { background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6' },
  low: { background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#a855f7' },
  info: { background: 'rgba(107, 114, 128, 0.12)', border: '1px solid rgba(107, 114, 128, 0.25)', color: '#9ca3af' },
}

export default function TaxPage({ userId }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [plSubTab, setPlSubTab] = useState('gains')
  const [expandedDividends, setExpandedDividends] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tax', userId],
    queryFn: () => getTaxData(userId),
    retry: 1,
  })

  const allHoldings = useMemo(() => {
    if (!data) return []
    const result = []
    const holdingsDict = data.holdings || {}
    for (const [assetClass, items] of Object.entries(holdingsDict)) {
      for (const item of items) {
        result.push({ ...item, asset_class: assetClass })
      }
    }
    return result
  }, [data])

  const gains = useMemo(() =>
    allHoldings.filter(h => h.unrealized_pnl >= 0).sort((a, b) => b.unrealized_pnl - a.unrealized_pnl),
    [allHoldings]
  )

  const losses = useMemo(() =>
    allHoldings.filter(h => h.unrealized_pnl < 0).sort((a, b) => a.unrealized_pnl - b.unrealized_pnl),
    [allHoldings]
  )

  if (isLoading) {
    return (
      <div>
        <div className="page-header"><h2>Tax Optimization</h2></div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <div className="page-header"><h2>Tax Optimization</h2></div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <AlertTriangle size={32} color="var(--accent-red)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Failed to load tax data. Make sure the backend is running.</p>
        </div>
      </div>
    )
  }

  const {
    annual_income, marginal_tax_rate, total_income_tax,
    summary, dividend_tax_analysis, srs_tax_relief, cpf_topup_relief,
    trading_income_risk, tax_savings_summary, suggestions,
    tax_loss_harvesting_opportunities: harvest_opps,
  } = data

  const tabs = [
    { id: 'overview', label: 'Tax Savings' },
    { id: 'dividends', label: 'Dividend Tax' },
    { id: 'holdings', label: 'Holdings P&L' },
    { id: 'risk', label: 'Risk Assessment' },
  ]

  const colHeader = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 16px',
  }
  const cell = {
    fontSize: 13, color: 'var(--text-primary)', padding: '14px 16px',
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Tax Optimization</h2>
        <p>Singapore-specific tax savings — SRS relief, CPF top-ups, dividend WHT, and more</p>
      </div>

      {/* ============ TOTAL SAVINGS BANNER ============ */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PiggyBank size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Potential Tax Savings This Year</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.02em' }}>
              {formatCurrency(tax_savings_summary.total_potential_savings)}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Income Tax: {formatCurrency(total_income_tax)}/yr</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marginal Rate: {marginal_tax_rate}%</div>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, marginTop: 4 }}>
              Save {tax_savings_summary.as_pct_of_income_tax}% of your tax bill
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SRS Tax Relief</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(tax_savings_summary.srs_relief)}</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CPF Top-Up Relief</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(tax_savings_summary.cpf_topup_relief)}</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Dividend WHT Avoidable</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(tax_savings_summary.dividend_wht_recoverable)}</div>
          </div>
        </div>
      </div>

      {/* ============ TAB SWITCHER ============ */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: activeTab === t.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ TAB: OVERVIEW ============ */}
      {activeTab === 'overview' && (
        <div>
          {/* SRS Tax Relief */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Landmark size={20} color="#3b82f6" />
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>SRS Tax Relief</h3>
              <span className="badge badge-blue" style={{ fontSize: 11 }}>Supplementary Retirement Scheme</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Max Contribution</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(srs_tax_relief.max_contribution)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>per year</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Tax Savings</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(srs_tax_relief.tax_savings)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>at {marginal_tax_rate}% marginal rate</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Effective Bonus</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{srs_tax_relief.effective_bonus_return_pct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>instant return on contribution</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Penalty-Free Withdrawal</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{srs_tax_relief.years_to_retirement_withdrawal}y</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>until age 62</div>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <Info size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} color="#3b82f6" />
              {srs_tax_relief.retirement_benefit}
            </div>
          </div>

          {/* CPF Cash Top-Up */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Building2 size={20} color="#10b981" />
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>CPF Cash Top-Up Tax Relief</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Self Top-Up (SA/RA)</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Up to {formatCurrency(cpf_topup_relief.max_self_topup)}</div>
                <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600, marginTop: 4 }}>Saves {formatCurrency(cpf_topup_relief.tax_savings_self)}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Family Top-Up</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Up to {formatCurrency(cpf_topup_relief.max_family_topup)}</div>
                <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600, marginTop: 4 }}>Saves {formatCurrency(cpf_topup_relief.tax_savings_family)}</div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Combined Savings</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)' }}>{formatCurrency(cpf_topup_relief.tax_savings_combined)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>CPF SA earns 4% p.a. risk-free</div>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <Info size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} color="#10b981" />
              {cpf_topup_relief.note}
            </div>
          </div>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Lightbulb size={20} color="var(--accent-yellow)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tax-Smart Suggestions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.map((s, i) => {
                  const pStyle = priorityStyles[s.priority] || priorityStyles.info
                  return (
                    <div key={i} style={{
                      padding: 16, borderRadius: 12,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.04em', ...pStyle,
                        }}>
                          {s.priority}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.message}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: DIVIDENDS ============ */}
      {activeTab === 'dividends' && (
        <div>
          {/* Dividend Summary */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe size={18} color="#3b82f6" />
                <span className="stat-label">Total Annual Dividends</span>
              </div>
              <div className="stat-value" style={{ fontSize: 24 }}>{formatCurrency(dividend_tax_analysis.total_annual_dividends)}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield size={18} color="#10b981" />
                <span className="stat-label">SG Dividends (Tax-Free)</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: 24 }}>{formatCurrency(dividend_tax_analysis.sg_dividends)}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ArrowDownRight size={18} color="var(--accent-red)" />
                <span className="stat-label">US WHT Lost (30%)</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-red)', fontSize: 24 }}>-{formatCurrency(dividend_tax_analysis.total_wht_paid)}</div>
            </div>
          </div>

          {/* WHT Explainer */}
          <div className="card" style={{ marginBottom: 20, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Why 30%?</strong> Singapore has <strong>no tax treaty</strong> with the US for dividend withholding. US-listed stocks automatically deduct 30% from dividends before you receive them. SG-listed stocks pay dividends tax-free under the one-tier corporate tax system. Shifting from US to SG equivalents can save you <strong>{formatCurrency(dividend_tax_analysis.total_wht_paid)}/year</strong>.
              </div>
            </div>
          </div>

          {/* Dividend Holdings Table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Dividend Income Breakdown</h3>
              <button
                onClick={() => setExpandedDividends(!expandedDividends)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                  cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'inherit',
                }}
              >
                {expandedDividends ? 'Show Top' : 'Show All'}
                {expandedDividends ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 0.8fr 1fr',
              borderBottom: '1px solid var(--border)', marginBottom: 4,
            }}>
              <div style={colHeader}>Holding</div>
              <div style={{ ...colHeader, textAlign: 'right' }}>Value</div>
              <div style={{ ...colHeader, textAlign: 'right' }}>Yield</div>
              <div style={{ ...colHeader, textAlign: 'right' }}>Annual Dividend</div>
              <div style={{ ...colHeader, textAlign: 'right' }}>WHT Rate</div>
              <div style={{ ...colHeader, textAlign: 'right' }}>Tax Paid</div>
            </div>

            {(expandedDividends ? dividend_tax_analysis.details : dividend_tax_analysis.details.slice(0, 8)).map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 0.8fr 1fr',
                  borderBottom: '1px solid var(--border)', alignItems: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ ...cell, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: getAssetColor(d.asset_class), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      {d.ticker && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.ticker}</span>}
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: d.domicile === 'SG' ? 'rgba(16, 185, 129, 0.15)' : d.domicile === 'US' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: d.domicile === 'SG' ? '#10b981' : d.domicile === 'US' ? '#ef4444' : '#9ca3af',
                      }}>
                        {d.domicile}
                      </span>
                      {d.tax_exempt && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>TAX-FREE</span>}
                    </div>
                  </div>
                </div>
                <div style={{ ...cell, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.value)}</div>
                <div style={{ ...cell, textAlign: 'right', color: 'var(--text-secondary)' }}>{d.dividend_yield_pct.toFixed(1)}%</div>
                <div style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(d.annual_dividend)}</div>
                <div style={{
                  ...cell, textAlign: 'right', fontWeight: 600,
                  color: d.wht_rate > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
                }}>
                  {d.wht_rate > 0 ? `${d.wht_rate}%` : '0%'}
                </div>
                <div style={{
                  ...cell, textAlign: 'right', fontWeight: 600,
                  color: d.wht_amount > 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                }}>
                  {d.wht_amount > 0 ? `-${formatCurrency(d.wht_amount)}` : '-'}
                </div>
              </div>
            ))}

            {/* Total row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 0.8fr 1fr',
              padding: '14px 0', borderTop: '2px solid var(--border)', marginTop: 4,
            }}>
              <div style={{ ...cell, fontWeight: 700, fontSize: 13 }}>Total</div>
              <div style={{ ...cell, textAlign: 'right' }}></div>
              <div style={{ ...cell, textAlign: 'right' }}></div>
              <div style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(dividend_tax_analysis.total_annual_dividends)}</div>
              <div style={{ ...cell, textAlign: 'right' }}></div>
              <div style={{ ...cell, textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)' }}>
                {dividend_tax_analysis.total_wht_paid > 0 ? `-${formatCurrency(dividend_tax_analysis.total_wht_paid)}` : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB: HOLDINGS P&L ============ */}
      {activeTab === 'holdings' && (
        <div>
          {/* P&L Summary */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ArrowUpRight size={18} color="var(--accent-green)" />
                <span className="stat-label">Total Unrealized Gains</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: 24 }}>+{formatCurrency(summary.total_unrealized_gains)}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ArrowDownRight size={18} color="var(--accent-red)" />
                <span className="stat-label">Total Unrealized Losses</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-red)', fontSize: 24 }}>-{formatCurrency(Math.abs(summary.total_unrealized_losses))}</div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <DollarSign size={18} color={summary.net_unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                <span className="stat-label">Net Position</span>
              </div>
              <div className="stat-value" style={{ color: summary.net_unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 24 }}>
                {formatSignedCurrency(summary.net_unrealized_pnl)}
              </div>
            </div>
          </div>

          {/* No CGT Banner */}
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Shield size={18} color="#10b981" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#10b981' }}>No Capital Gains Tax</strong> — Singapore does not tax individual capital gains. These P&L figures are informational. However, short-term trading gains may be reclassified as taxable income by IRAS.
            </span>
          </div>

          {/* Holdings Table */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Holdings</h3>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
                {[
                  { key: 'gains', label: `Gains (${gains.length})`, color: 'var(--accent-green)' },
                  { key: 'losses', label: `Losses (${losses.length})`, color: 'var(--accent-red)' },
                ].map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setPlSubTab(btn.key)}
                    style={{
                      padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      background: plSubTab === btn.key ? btn.color : 'transparent',
                      color: plSubTab === btn.key ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <HoldingsTable
              holdings={plSubTab === 'losses' ? losses : gains}
              colHeader={colHeader}
              cell={cell}
              emptyLabel={plSubTab === 'losses' ? 'losses' : 'gains'}
            />
          </div>

          {/* Tax-Loss Harvesting */}
          {harvest_opps && harvest_opps.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Scissors size={20} color="var(--accent-yellow)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tax-Loss Harvesting (Strategic Rebalancing)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {harvest_opps.map((item, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 12,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                        {item.ticker && <span className="badge badge-red" style={{ fontSize: 11 }}>{item.ticker}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Sell to crystallise loss and redeploy into similar-exposure assets. Held for {formatHoldingPeriod(item.holding_period_months)}.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Loss</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-red)' }}>-{formatCurrency(Math.abs(item.unrealized_pnl))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: RISK ASSESSMENT ============ */}
      {activeTab === 'risk' && (
        <div>
          {/* Risk Level Banner */}
          <div className="card" style={{
            marginBottom: 24,
            background: trading_income_risk.risk_level === 'high' ? 'rgba(239, 68, 68, 0.06)'
              : trading_income_risk.risk_level === 'moderate' ? 'rgba(245, 158, 11, 0.06)'
              : 'rgba(16, 185, 129, 0.06)',
            border: `1px solid ${
              trading_income_risk.risk_level === 'high' ? 'rgba(239, 68, 68, 0.2)'
              : trading_income_risk.risk_level === 'moderate' ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(16, 185, 129, 0.2)'
            }`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: trading_income_risk.risk_level === 'high' ? 'rgba(239, 68, 68, 0.15)'
                  : trading_income_risk.risk_level === 'moderate' ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
              }}>
                {trading_income_risk.risk_level === 'low'
                  ? <Shield size={24} color="#10b981" />
                  : <AlertTriangle size={24} color={trading_income_risk.risk_level === 'high' ? '#ef4444' : '#f59e0b'} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>
                  IRAS Trading Income Reclassification Risk
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, textTransform: 'capitalize',
                  color: trading_income_risk.risk_level === 'high' ? '#ef4444'
                    : trading_income_risk.risk_level === 'moderate' ? '#f59e0b' : '#10b981',
                }}>
                  {trading_income_risk.risk_level} Risk
                </div>
              </div>
              {trading_income_risk.potential_tax_if_classified_as_income > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Potential Tax Exposure</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-red)' }}>
                    {formatCurrency(trading_income_risk.potential_tax_if_classified_as_income)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>if gains classified as income</div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Short-Term Holdings (&lt;12 mo)</div>
              <div className="stat-value" style={{ fontSize: 28 }}>{trading_income_risk.short_term_holdings_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Short-Term with Gains</div>
              <div className="stat-value" style={{ fontSize: 28, color: 'var(--accent-yellow)' }}>{trading_income_risk.short_term_with_gains}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Short-Term Unrealised Gains</div>
              <div className="stat-value" style={{ fontSize: 24, color: trading_income_risk.short_term_total_gains > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                {formatCurrency(trading_income_risk.short_term_total_gains)}
              </div>
            </div>
          </div>

          {/* Short-Term Holdings */}
          {trading_income_risk.holdings.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Clock size={20} color="#f59e0b" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Short-Term Holdings (&lt;12 Months)</h3>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                borderBottom: '1px solid var(--border)', marginBottom: 4,
              }}>
                <div style={colHeader}>Holding</div>
                <div style={{ ...colHeader, textAlign: 'right' }}>Holding Period</div>
                <div style={{ ...colHeader, textAlign: 'right' }}>Unrealized P&L</div>
                <div style={{ ...colHeader, textAlign: 'right' }}>P&L %</div>
              </div>

              {trading_income_risk.holdings.map((h, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  borderBottom: '1px solid var(--border)', alignItems: 'center',
                  transition: 'background 0.15s ease',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ ...cell, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getAssetColor(h.asset_class), flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{h.name}</div>
                      {h.ticker && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.ticker}</div>}
                    </div>
                  </div>
                  <div style={{
                    ...cell, textAlign: 'right', fontWeight: 600,
                    color: h.holding_period_months < 6 ? 'var(--accent-red)' : 'var(--accent-yellow)',
                  }}>
                    {formatHoldingPeriod(h.holding_period_months)}
                  </div>
                  <div style={{
                    ...cell, textAlign: 'right', fontWeight: 600,
                    color: h.unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {formatSignedCurrency(h.unrealized_pnl)}
                  </div>
                  <div style={{
                    ...cell, textAlign: 'right', fontWeight: 600,
                    color: h.unrealized_pnl_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {h.unrealized_pnl_pct >= 0 ? '+' : ''}{h.unrealized_pnl_pct.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IRAS Factors */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Info size={20} color="#3b82f6" />
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>IRAS Assessment Factors</h3>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              IRAS uses the "badges of trade" test to determine if gains are taxable income. Key factors:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trading_income_risk.iras_factors.map((f, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: 12, fontWeight: 700, color: '#3b82f6',
                  }}>{i + 1}</div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ FOOTER DISCLAIMER ============ */}
      <div style={{
        marginTop: 24, padding: 16, borderRadius: 12,
        background: 'rgba(107, 114, 128, 0.06)', border: '1px solid rgba(107, 114, 128, 0.15)',
        fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        <strong>Disclaimer:</strong> Tax figures shown are estimates based on publicly available Singapore tax rules (IRAS YA2024+). This does not constitute tax advice. Consult a qualified tax professional for personalised guidance. WealthPulse does not file taxes or execute transactions on your behalf.
      </div>
    </div>
  )
}

function HoldingsTable({ holdings, colHeader, cell, emptyLabel }) {
  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 0.8fr',
        borderBottom: '1px solid var(--border)', marginBottom: 4,
      }}>
        <div style={colHeader}>Name</div>
        <div style={{ ...colHeader, textAlign: 'right' }}>Current Value</div>
        <div style={{ ...colHeader, textAlign: 'right' }}>Cost Basis</div>
        <div style={{ ...colHeader, textAlign: 'right' }}>Unrealized P&L</div>
        <div style={{ ...colHeader, textAlign: 'right' }}>P&L %</div>
        <div style={{ ...colHeader, textAlign: 'right' }}>Holding Period</div>
      </div>

      {holdings.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No {emptyLabel} to show.
        </div>
      ) : (
        holdings.map((h, i) => (
          <div
            key={i}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 0.8fr',
              borderBottom: '1px solid var(--border)', alignItems: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ ...cell, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: getAssetColor(h.asset_class), flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{h.name}</div>
                {h.ticker && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.ticker}</div>}
              </div>
            </div>
            <div style={{ ...cell, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(h.value)}</div>
            <div style={{ ...cell, textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(h.cost_basis)}</div>
            <div style={{ ...cell, textAlign: 'right', fontWeight: 600, color: h.unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {formatSignedCurrency(h.unrealized_pnl)}
            </div>
            <div style={{ ...cell, textAlign: 'right', fontWeight: 600, color: h.unrealized_pnl_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {h.unrealized_pnl_pct >= 0 ? '+' : ''}{h.unrealized_pnl_pct.toFixed(1)}%
            </div>
            <div style={{ ...cell, textAlign: 'right', color: 'var(--text-secondary)' }}>
              {formatHoldingPeriod(h.holding_period_months)}
            </div>
          </div>
        ))
      )}
    </>
  )
}
