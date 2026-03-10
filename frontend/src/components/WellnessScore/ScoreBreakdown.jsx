const SCORE_CONFIG = {
  diversification: { label: 'Diversification', weight: '25%', icon: '◎' },
  liquidity: { label: 'Liquidity', weight: '20%', icon: '◉' },
  behavioral_resilience: { label: 'Behavioral Resilience', weight: '20%', icon: '◈' },
  goal_alignment: { label: 'Goal Alignment', weight: '20%', icon: '◇' },
  digital_readiness: { label: 'Digital Readiness', weight: '15%', icon: '◆' },
}

function getBarColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  if (score >= 35) return '#f97316'
  return '#ef4444'
}

export default function ScoreBreakdown({ subScores }) {
  if (!subScores) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(subScores).map(([key, data]) => {
        const config = SCORE_CONFIG[key]
        const color = getBarColor(data.score)
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{config?.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{config?.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({config?.weight})</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{
              height: 6, background: 'var(--bg-secondary)',
              borderRadius: 3, overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${data.score}%`, background: color,
                borderRadius: 3, transition: 'width 0.8s ease'
              }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data.insight}</p>
          </div>
        )
      })}
    </div>
  )
}
