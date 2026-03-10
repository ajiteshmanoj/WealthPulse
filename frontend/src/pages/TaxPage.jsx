import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTaxData } from '../services/api'
import { TrendingUp, TrendingDown, DollarSign, Scissors, Lightbulb, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react'

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

export default function TaxPage({ userId }) {
  const [activeTab, setActiveTab] = useState('gains')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tax', userId],
    queryFn: () => getTaxData(userId),
    retry: 1,
  })

  // All hooks must be called before any early returns (React rules of hooks)
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
    allHoldings
      .filter(h => h.unrealized_pnl >= 0)
      .sort((a, b) => Math.abs(b.unrealized_pnl) - Math.abs(a.unrealized_pnl)),
    [allHoldings]
  )

  const losses = useMemo(() =>
    allHoldings
      .filter(h => h.unrealized_pnl < 0)
      .sort((a, b) => Math.abs(b.unrealized_pnl) - Math.abs(a.unrealized_pnl)),
    [allHoldings]
  )

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Tax Optimization</h2>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <div className="page-header">
          <h2>Tax Optimization</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <AlertTriangle size={32} color="var(--accent-red)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Failed to load tax data. Make sure the backend is running on port 8000.</p>
        </div>
      </div>
    )
  }

  const { summary, tax_loss_harvesting_opportunities: tax_loss_harvesting, suggestions, regulatory_note } = data
  const { total_unrealized_gains, total_unrealized_losses, net_unrealized_pnl } = summary

  const displayedHoldings = activeTab === 'gains' ? gains : losses

  const columnHeaderStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '12px 16px',
  }

  const cellStyle = {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '14px 16px',
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Tax Optimization</h2>
        <p>Unrealized gains & losses with tax-loss harvesting insights</p>
      </div>

      {/* Summary Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ArrowUpRight size={18} color="var(--accent-green)" />
            <span className="stat-label">Total Unrealized Gains</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: 24 }}>
            +{formatCurrency(total_unrealized_gains)}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ArrowDownRight size={18} color="var(--accent-red)" />
            <span className="stat-label">Total Unrealized Losses</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-red)', fontSize: 24 }}>
            -{formatCurrency(Math.abs(total_unrealized_losses))}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DollarSign size={18} color={net_unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
            <span className="stat-label">Net Position</span>
          </div>
          <div className="stat-value" style={{ color: net_unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 24 }}>
            {formatSignedCurrency(net_unrealized_pnl)}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Holdings</h3>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setActiveTab('gains')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                background: activeTab === 'gains' ? 'var(--accent-green)' : 'transparent',
                color: activeTab === 'gains' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Gains ({gains.length})
            </button>
            <button
              onClick={() => setActiveTab('losses')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                background: activeTab === 'losses' ? 'var(--accent-red)' : 'transparent',
                color: activeTab === 'losses' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Losses ({losses.length})
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 0.8fr',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4,
        }}>
          <div style={columnHeaderStyle}>Name</div>
          <div style={{ ...columnHeaderStyle, textAlign: 'right' }}>Current Value</div>
          <div style={{ ...columnHeaderStyle, textAlign: 'right' }}>Cost Basis</div>
          <div style={{ ...columnHeaderStyle, textAlign: 'right' }}>Unrealized P&L</div>
          <div style={{ ...columnHeaderStyle, textAlign: 'right' }}>P&L %</div>
          <div style={{ ...columnHeaderStyle, textAlign: 'right' }}>Holding Period</div>
        </div>

        {/* Table Rows */}
        {displayedHoldings.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No {activeTab === 'gains' ? 'gains' : 'losses'} to show.
          </div>
        ) : (
          displayedHoldings.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 0.8fr',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ ...cellStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getAssetColor(h.asset_class),
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{h.name}</div>
                  {h.ticker && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{h.ticker}</div>
                  )}
                </div>
              </div>
              <div style={{ ...cellStyle, textAlign: 'right', fontWeight: 500 }}>
                {formatCurrency(h.value)}
              </div>
              <div style={{ ...cellStyle, textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatCurrency(h.cost_basis)}
              </div>
              <div style={{
                ...cellStyle,
                textAlign: 'right',
                fontWeight: 600,
                color: h.unrealized_pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              }}>
                {formatSignedCurrency(h.unrealized_pnl)}
              </div>
              <div style={{
                ...cellStyle,
                textAlign: 'right',
                fontWeight: 600,
                color: h.unrealized_pnl_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              }}>
                {h.unrealized_pnl_pct >= 0 ? '+' : ''}{h.unrealized_pnl_pct.toFixed(1)}%
              </div>
              <div style={{ ...cellStyle, textAlign: 'right', color: 'var(--text-secondary)' }}>
                {formatHoldingPeriod(h.holding_period_months)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tax-Loss Harvesting Opportunities */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Scissors size={20} color="var(--accent-yellow)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tax-Loss Harvesting Opportunities</h3>
        </div>

        {tax_loss_harvesting && tax_loss_harvesting.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {tax_loss_harvesting.map((item, i) => (
              <div key={i} style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{item.name}</span>
                    {item.ticker && (
                      <span className="badge badge-red" style={{ fontSize: 11 }}>{item.ticker}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Sell to crystallise loss and redeploy into similar-exposure assets. Holding period: {formatHoldingPeriod(item.holding_period_months)}.
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Loss</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-red)' }}>
                    -{formatCurrency(Math.abs(item.unrealized_pnl))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No tax-loss harvesting opportunities found (no holdings with losses exceeding SGD 500).
          </div>
        )}

        <div style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Note on Singapore Tax
          </div>
          Singapore does not levy capital gains tax on individuals. However, tax-loss harvesting is valuable for:
          <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
            <li style={{ marginBottom: 4 }}>Rebalancing without regret</li>
            <li style={{ marginBottom: 4 }}>Corporate/institutional investors subject to income tax on trading gains</li>
            <li>Offsetting gains if tax rules change</li>
          </ol>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Lightbulb size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Smart Suggestions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <Lightbulb size={16} color="var(--accent-yellow)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{typeof s === 'string' ? s : s.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
