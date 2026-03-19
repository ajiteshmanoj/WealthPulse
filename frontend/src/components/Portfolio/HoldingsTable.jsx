const LABELS = {
  equities: 'Equities',
  bonds: 'Bonds',
  cash: 'Cash',
  crypto: 'Crypto',
  private_assets: 'Private Assets',
  tokenised_assets: 'Tokenised Assets',
}

const COLORS = {
  equities: '#3b82f6',
  bonds: '#10b981',
  cash: '#f59e0b',
  crypto: '#8b5cf6',
  private_assets: '#f97316',
  tokenised_assets: '#06b6d4',
}

function Sparkline({ data, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - 2 - ((val - min) / range) * (height - 4)
    return `${x},${y}`
  }).join(' ')

  const isUp = data[data.length - 1] >= data[0]
  const color = isUp ? '#10b981' : '#ef4444'

  const fillPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#grad-${isUp ? 'up' : 'down'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Column widths: Name(flex) | Trend(100px) | Value(130px) | Allocation(100px) | Last col(120px)
const COL_WIDTHS = { trend: 100, value: 130, allocation: 100, last: 120 }

export default function HoldingsTable({ holdings, activeClass = 'all' }) {
  if (!holdings) return null

  const classes = activeClass === 'all'
    ? Object.keys(holdings)
    : [activeClass]

  return (
    <div style={{ overflowX: 'auto' }}>
      {classes.map(cls => {
        const items = holdings[cls]
        if (!items || items.length === 0) return null
        const hasTrend = items.some(item => item.trend && item.trend.length > 1)
        const hasLastCol = cls === 'equities' || cls === 'crypto' || cls === 'bonds' || cls === 'private_assets' || cls === 'tokenised_assets'

        const lastColLabel = (cls === 'equities' || cls === 'crypto') ? 'Day Change'
          : cls === 'bonds' ? 'Yield'
          : cls === 'private_assets' ? 'Liquidity'
          : cls === 'tokenised_assets' ? 'Type'
          : null

        return (
          <div key={cls} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[cls] }} />
              <h4 style={{ fontSize: 14, fontWeight: 600 }}>{LABELS[cls]}</h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({items.length} holdings)</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col />
                {hasTrend && <col style={{ width: COL_WIDTHS.trend }} />}
                <col style={{ width: COL_WIDTHS.value }} />
                <col style={{ width: COL_WIDTHS.allocation }} />
                {hasLastCol && <col style={{ width: COL_WIDTHS.last }} />}
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Name</th>
                  {hasTrend && <th style={{ ...thStyle, textAlign: 'center' }}>30D Trend</th>}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Value (SGD)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Allocation</th>
                  {hasLastCol && <th style={{ ...thStyle, textAlign: 'right' }}>{lastColLabel}</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.ticker && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: COLORS[cls],
                            background: `${COLORS[cls]}15`, padding: '2px 6px',
                            borderRadius: 4, flexShrink: 0,
                          }}>
                            {item.ticker}
                          </span>
                        )}
                        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </div>
                    </td>
                    {hasTrend && (
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {item.trend && item.trend.length > 1 ? (
                          <Sparkline data={item.trend} />
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )}
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                      {item.value.toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {item.allocation_pct}%
                    </td>
                    {(cls === 'equities' || cls === 'crypto') && (
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontSize: 13, fontWeight: 600,
                        color: item.day_change_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                      }}>
                        {item.day_change_pct >= 0 ? '+' : ''}{item.day_change_pct}%
                      </td>
                    )}
                    {cls === 'bonds' && (
                      <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--accent-green)', fontSize: 13 }}>
                        {item.yield_pct}%
                      </td>
                    )}
                    {cls === 'private_assets' && (
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span className={`badge badge-${item.liquidity === 'low' ? 'orange' : 'blue'}`}>
                          {item.liquidity}
                        </span>
                      </td>
                    )}
                    {cls === 'tokenised_assets' && (
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span className="badge badge-purple">
                          {item.type?.replace('tokenised_', '')}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

const thStyle = {
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  textAlign: 'left',
}

const tdStyle = {
  padding: '12px',
}
