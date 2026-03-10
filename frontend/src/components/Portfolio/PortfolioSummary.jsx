import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  equities: '#3b82f6',
  bonds: '#10b981',
  cash: '#f59e0b',
  crypto: '#8b5cf6',
  private_assets: '#f97316',
  tokenised_assets: '#06b6d4',
}

const LABELS = {
  equities: 'Equities',
  bonds: 'Bonds',
  cash: 'Cash',
  crypto: 'Crypto',
  private_assets: 'Private Assets',
  tokenised_assets: 'Tokenised Assets',
}

function formatCurrency(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val}`
}

export default function PortfolioSummary({ holdings, totalWealth }) {
  if (!holdings) return null

  const data = Object.entries(holdings).map(([key, items]) => ({
    name: LABELS[key] || key,
    value: items.reduce((sum, item) => sum + item.value, 0),
    color: COLORS[key] || '#64748b',
    key,
  })).filter(d => d.value > 0)

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 200, height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
              }}
              formatter={(val) => [`SGD ${val.toLocaleString()}`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
        {data.map(d => (
          <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(d.value)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>
              {(d.value / totalWealth * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
