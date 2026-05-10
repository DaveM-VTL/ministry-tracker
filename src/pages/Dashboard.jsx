// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { getSessions, getContacts, TYPE_LABELS, TYPE_ICONS, summariseByMonth } from '../firebase/services'
import { format, startOfMonth, endOfMonth, isAfter, isBefore, addDays } from 'date-fns'

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green-dark)', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getSessions(user.uid), getContacts(user.uid)]).then(([s, c]) => {
      setSessions(s)
      setContacts(c)
      setLoading(false)
    })
  }, [user])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonth = sessions.filter(s => s.date && s.date >= monthStart && s.date <= monthEnd)
  const monthHours = thisMonth.reduce((t, s) => t + Number(s.hours || 0), 0)
  const monthPlacements = thisMonth.reduce((t, s) => t + Number(s.placements || 0), 0)
  const monthRVs = thisMonth.reduce((t, s) => t + Number(s.returnVisits || 0), 0)
  const monthBS = thisMonth.reduce((t, s) => t + Number(s.bibleStudies || 0), 0)

  const upcoming = contacts
    .filter(c => c.nextFollowUp && isAfter(c.nextFollowUp, now) && isBefore(c.nextFollowUp, addDays(now, 14)))
    .sort((a, b) => a.nextFollowUp - b.nextFollowUp)
    .slice(0, 5)

  const recentSessions = sessions.slice(0, 5)

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26 }}>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'} 🌿</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{format(now, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--text-secondary)' }}>
        {format(now, 'MMMM')} at a glance
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
        <StatCard icon="⏱" label="Hours" value={monthHours.toFixed(1)} sub="this month" />
        <StatCard icon="📚" label="Placements" value={monthPlacements} sub="this month" />
        <StatCard icon="🔁" label="Return Visits" value={monthRVs} sub="this month" />
        <StatCard icon="📖" label="Bible Studies" value={monthBS} sub="this month" />
        <StatCard icon="👥" label="Contacts" value={contacts.length} sub="total" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming follow-ups */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18 }}>Upcoming Follow-ups</h2>
            <Link to="/contacts" style={{ fontSize: 13, color: 'var(--green-dark)' }}>View all →</Link>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <p>No follow-ups in the next 2 weeks.</p>
              </div>
            ) : (
              upcoming.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/contacts/${c.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 18px',
                    borderBottom: i < upcoming.length - 1 ? '1px solid var(--border-light)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {TYPE_ICONS[c.ministryType] || '📋'} {TYPE_LABELS[c.ministryType] || c.ministryType}
                    </div>
                  </div>
                  <span className="badge badge-amber">
                    {format(c.nextFollowUp, 'MMM d')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18 }}>Recent Sessions</h2>
            <Link to="/sessions" style={{ fontSize: 13, color: 'var(--green-dark)' }}>View all →</Link>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recentSessions.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <p>No sessions recorded yet.</p>
              </div>
            ) : (
              recentSessions.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 18px',
                    borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {TYPE_ICONS[s.type] || '📋'} {TYPE_LABELS[s.type] || s.type}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {s.date ? format(s.date, 'MMM d, yyyy') : '—'}
                    </div>
                  </div>
                  <span className="badge badge-green">{s.hours}h</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
