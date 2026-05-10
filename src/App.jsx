// src/App.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import './styles/global.css'

import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Reports from './pages/Reports'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function NavBar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <nav style={{
      background: 'var(--white)',
      borderBottom: '1.5px solid var(--border-light)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 58,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 22 }}>🌿</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--green-dark)' }}>
          Ministry Tracker
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { to: '/', label: '🏠 Dashboard', end: true },
          { to: '/sessions', label: '⏱ Sessions' },
          { to: '/contacts', label: '👥 Contacts' },
          { to: '/reports', label: '📊 Reports' },
        ].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: 600,
              color: isActive ? 'var(--green-dark)' : 'var(--text-secondary)',
              background: isActive ? 'var(--green-light)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <button className="btn btn-secondary btn-sm" onClick={handleSignOut}>
        Sign out
      </button>
    </nav>
  )
}

function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleAnonymousLogin = async () => {
    setLoading(true)
    try {
      await signInAnonymously(auth)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--cream) 0%, var(--green-light) 100%)',
      padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '48px 40px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Ministry Tracker</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
          Your personal companion for tracking field service hours, contacts, and placements.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 16 }}
          onClick={handleAnonymousLogin}
          disabled={loading}
        >
          {loading ? 'Starting…' : '✨ Get Started'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          Your data is stored securely in Firebase and tied to this device.
        </p>
      </div>
    </div>
  )
}

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Loading…</p>
    </div>
  )

  if (!user) return <LoginPage />

  return (
    <>
      <NavBar />
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
