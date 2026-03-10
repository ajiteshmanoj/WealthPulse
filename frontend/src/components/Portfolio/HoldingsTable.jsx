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
        return (
          <div key={cls} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[cls] }} />
              <h4 style={{ fontSize: 14, fontWeight: 600 }}>{LABELS[cls]}</h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({items.length} holdings)</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Value (SGD)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Allocation</th>
                  {cls === 'equities' || cls === 'crypto' ? (
                    <th style={{ ...thStyle, textAlign: 'right' }}>Day Change</th>
                  ) : null}
                  {cls === 'bonds' ? (
                    <th style={{ ...thStyle, textAlign: 'right' }}>Yield</th>
                  ) : null}
                  {cls === 'private_assets' ? (
                    <th style={{ ...thStyle, textAlign: 'right' }}>Liquidity</th>
                  ) : null}
                  {cls === 'tokenised_assets' ? (
                    <th style={{ ...thStyle, textAlign: 'right' }}>Type</th>
                  ) : null}
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
                            borderRadius: 4
                          }}>
                            {item.ticker}
                          </span>
                        )}
                        <span style={{ fontSize: 13 }}>{item.name}</span>
                      </div>
                    </td>
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
