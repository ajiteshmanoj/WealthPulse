import { useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Activity, PieChart, Newspaper, Zap, Brain, Users, Target, TrendingUp } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import GoalsPage from './pages/GoalsPage'
import ScenariosPage from './pages/ScenariosPage'
import NewsPage from './pages/NewsPage'
import ClientsPage from './pages/ClientsPage'
import './App.css'

const USERS = [
  { id: 'alex_tan', name: 'Alex Tan', label: 'Aggressive' },
  { id: 'sarah_lim', name: 'Sarah Lim', label: 'Balanced' },
  { id: 'david_chen', name: 'David Chen', label: 'Conservative' },
]

function App() {
  const [userId, setUserId] = useState('alex_tan')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-dot">W</div>
          <div>
            <h1>WealthPulse</h1>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Wealth Wellness Hub</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Investor View</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Activity size={18} /> Dashboard
          </NavLink>
          <NavLink to="/goals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Target size={18} /> Goal Planner
          </NavLink>
          <NavLink to="/scenarios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Zap size={18} /> Scenario Lab
          </NavLink>
          <NavLink to="/news" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Newspaper size={18} /> Market Pulse
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Adviser View</div>
          <NavLink to="/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} /> Client Book
          </NavLink>
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <div className="sidebar-section-title">Investor Profile</div>
          {USERS.map(u => (
            <button
              key={u.id}
              className={`sidebar-link ${userId === u.id ? 'active' : ''}`}
              onClick={() => setUserId(u.id)}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: userId === u.id ? 'var(--gradient-primary)' : 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
              }}>
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: 13 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            NFC FinTech Hackathon 2026<br />
            Schroders Problem Statement
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard userId={userId} />} />
          <Route path="/goals" element={<GoalsPage userId={userId} />} />
          <Route path="/scenarios" element={<ScenariosPage userId={userId} />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
