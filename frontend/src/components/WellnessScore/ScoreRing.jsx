import { useEffect, useState } from 'react'

export default function ScoreRing({ score, size = 180, color = '#3b82f6', label }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference

  useEffect(() => {
    let start = 0
    const step = () => {
      start += 2
      if (start > score) start = score
      setAnimatedScore(start)
      if (start < score) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score])

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 800, color }}>{animatedScore}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
        {label && <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, textAlign: 'center', padding: '0 20px' }}>{label}</span>}
      </div>
    </div>
  )
}
