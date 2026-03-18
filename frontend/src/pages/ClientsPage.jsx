import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getClients, getClientReport } from '../services/api'
import { Users, AlertTriangle, CheckCircle, Clock, FileText, X, Copy, Check, Loader2, Sparkles } from 'lucide-react'

function getScoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  if (score >= 35) return '#f97316'
  return '#ef4444'
}

function formatAUM(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  return `$${(val / 1000).toFixed(0)}K`
}

export default function ClientsPage() {
  const [reportModal, setReportModal] = useState(null) // { loading, data, error }
  const [loadingClientId, setLoadingClientId] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const handleGenerateReport = async (clientId) => {
    setLoadingClientId(clientId)
    setReportModal({ loading: true, data: null, error: null })
    try {
      const result = await getClientReport(clientId)
      setReportModal({ loading: false, data: result, error: null })
    } catch (err) {
      setReportModal({ loading: false, data: null, error: err.message || 'Failed to generate report' })
    } finally {
      setLoadingClientId(null)
    }
  }

  const handleCopy = () => {
    if (!reportModal?.data) return
    const r = reportModal.data.report
    const text = `Subject: ${r.subject}\n\n${r.greeting}\n\n${r.summary}\n\nKey Findings:\n${r.key_findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nRecommendations:\n${r.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}\n\n${r.closing}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeModal = () => {
    setReportModal(null)
    setCopied(false)
  }

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h2>Client Book</h2>
          <p>Loading adviser dashboard...</p>
        </div>
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      </div>
    )
  }

  const clients = data?.clients || []
  const avgScore = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.wellness_score, 0) / clients.length)
    : 0
  const atRisk = clients.filter(c => c.wellness_score < 50).length
  const totalAUM = clients.reduce((s, c) => s + c.aum, 0)

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Client Book</h2>
        <p>Adviser view — manage and monitor your client portfolio</p>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{clients.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total AUM</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{formatAUM(totalAUM)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Wellness</div>
          <div className="stat-value" style={{ color: getScoreColor(avgScore) }}>{avgScore}</div>
        </div>
        <div className="stat-card" style={{ borderColor: atRisk > 0 ? '#ef444430' : undefined }}>
          <div className="stat-label">At Risk</div>
          <div className="stat-value" style={{ color: atRisk > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {atRisk}
          </div>
        </div>
      </div>

      {/* Client cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {clients.sort((a, b) => a.wellness_score - b.wellness_score).map(client => {
          const scoreColor = getScoreColor(client.wellness_score)
          const isGenerating = loadingClientId === client.id
          return (
            <div key={client.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '180px 70px 80px 1fr 150px 200px 140px',
                alignItems: 'center',
                gap: 16,
              }}>
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${scoreColor}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: scoreColor,
                    border: `1px solid ${scoreColor}40`,
                  }}>
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Age {client.age} · {client.risk_profile}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                    {client.wellness_score}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginTop: 2 }}>
                    Wellness
                  </div>
                </div>

                {/* AUM */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{formatAUM(client.aum)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>AUM</div>
                </div>

                {/* Portfolio bars */}
                <div>
                  <div style={{
                    display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden',
                    background: 'var(--bg-secondary)'
                  }}>
                    <div style={{ width: `${client.portfolio_summary.equities_pct}%`, background: '#3b82f6' }} />
                    <div style={{ width: `${client.portfolio_summary.bonds_pct}%`, background: '#10b981' }} />
                    <div style={{ width: `${client.portfolio_summary.cash_pct}%`, background: '#f59e0b' }} />
                    <div style={{ width: `${client.portfolio_summary.crypto_pct}%`, background: '#8b5cf6' }} />
                    <div style={{ width: `${client.portfolio_summary.other_pct}%`, background: '#f97316' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    <span style={{ fontSize: 9, color: '#3b82f6' }}>EQ {client.portfolio_summary.equities_pct}%</span>
                    <span style={{ fontSize: 9, color: '#10b981' }}>BD {client.portfolio_summary.bonds_pct}%</span>
                    <span style={{ fontSize: 9, color: '#f59e0b' }}>CA {client.portfolio_summary.cash_pct}%</span>
                    <span style={{ fontSize: 9, color: '#8b5cf6' }}>CR {client.portfolio_summary.crypto_pct}%</span>
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.goal_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {client.goal_on_track ? (
                      <>
                        <CheckCircle size={11} color="var(--accent-green)" />
                        <span style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 600 }}>On Track</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={11} color="var(--accent-red)" />
                        <span style={{ fontSize: 10, color: 'var(--accent-red)', fontWeight: 600 }}>Off Track</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk flags */}
                <div>
                  {client.risk_flags.length === 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>No risk flags</span>
                  ) : (
                    client.risk_flags.slice(0, 2).map((flag, i) => (
                      <div key={i} style={{
                        fontSize: 10, color: 'var(--accent-orange)',
                        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        <AlertTriangle size={9} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{flag}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Generate Report Button */}
                <div style={{ justifySelf: 'end' }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '7px 12px', gap: 5, whiteSpace: 'nowrap' }}
                    onClick={() => handleGenerateReport(client.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText size={13} />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Report Modal */}
      {reportModal && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--bg-card)', borderRadius: 16,
              border: '1px solid var(--border)', maxWidth: 640, width: '100%',
              maxHeight: '85vh', overflowY: 'auto', padding: 28,
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {reportModal.loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)', marginBottom: 16 }} />
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Generating personalized report...</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Analyzing client data with AI</div>
              </div>
            ) : reportModal.error ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <AlertTriangle size={32} style={{ color: 'var(--accent-red)', marginBottom: 16 }} />
                <div style={{ fontSize: 14, color: 'var(--accent-red)' }}>{reportModal.error}</div>
                <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={closeModal}>Close</button>
              </div>
            ) : reportModal.data ? (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileText size={20} style={{ color: 'var(--accent-blue)' }} />
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>Client Report — {reportModal.data.client_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {reportModal.data.generated_by === 'ai' ? (
                          <span className="badge badge-purple" style={{ fontSize: 11, padding: '3px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}>
                            <Sparkles size={10} /> Live AI
                          </span>
                        ) : (
                          <span className="badge badge-blue" style={{ fontSize: 11, padding: '3px 8px' }}>Template</span>
                        )}
                        {reportModal.data.generated_by === 'ai' && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by Claude AI</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Email content */}
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 12,
                  border: '1px solid var(--border)', padding: 24,
                }}>
                  {/* Subject */}
                  <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Subject</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{reportModal.data.report.subject}</div>
                  </div>

                  {/* Greeting */}
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, fontWeight: 500 }}>
                    {reportModal.data.report.greeting}
                  </div>

                  {/* Summary */}
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                    {reportModal.data.report.summary}
                  </div>

                  {/* Key Findings */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--accent-orange)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
                    }}>
                      Key Findings
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {reportModal.data.report.key_findings.map((finding, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                          padding: '10px 12px', background: 'rgba(249, 115, 22, 0.05)', borderRadius: 8,
                          border: '1px solid rgba(249, 115, 22, 0.1)',
                        }}>
                          <AlertTriangle size={14} style={{ color: 'var(--accent-orange)', flexShrink: 0, marginTop: 3 }} />
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--accent-green)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
                    }}>
                      Recommendations
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {reportModal.data.report.recommendations.map((rec, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                          padding: '10px 12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8,
                          border: '1px solid rgba(16, 185, 129, 0.1)',
                        }}>
                          <CheckCircle size={14} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 3 }} />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Closing */}
                  <div style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                    paddingTop: 16, borderTop: '1px solid var(--border)', whiteSpace: 'pre-line',
                  }}>
                    {reportModal.data.report.closing}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-outline" onClick={closeModal}>Close</button>
                  <button className="btn btn-primary" onClick={handleCopy} style={{ gap: 6 }}>
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>,
        document.body
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
