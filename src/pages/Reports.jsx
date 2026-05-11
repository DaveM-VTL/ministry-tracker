// src/pages/Reports.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../App'
import { getSessions, summariseByMonth, TYPE_LABELS, TYPE_ICONS, MINISTRY_TYPES } from '../firebase/services'
import { format, parse } from 'date-fns'

export default function Reports() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getSessions(user.uid).then(data => { setSessions(data); setLoading(false) })
  }, [user])

  const monthly = summariseByMonth(sessions)

  const typeTotals = MINISTRY_TYPES.reduce((acc, t) => {
    const typeSessions = sessions.filter(s => s.type === t)
    acc[t] = {
      hours: typeSessions.reduce((sum, s) => sum + Number(s.hours || 0), 0),
      creditHours: typeSessions.reduce((sum, s) => sum + Number(s.creditHours || 0), 0),
      count: typeSessions.length,
      placements: typeSessions.reduce((sum, s) => sum + Number(s.placements || 0), 0),
    }
    return acc
  }, {})

  const totalHours = sessions.reduce((t, s) => t + Number(s.hours || 0), 0)
  const totalCreditHours = sessions.reduce((t, s) => t + Number(s.creditHours || 0), 0)
  const totalPlacements = sessions.reduce((t, s) => t + Number(s.placements || 0), 0)
  const totalRVs = sessions.reduce((t, s) => t + Number(s.returnVisits || 0), 0)
  const totalBS = sessions.reduce((t, s) => t + Number(s.bibleStudies || 0), 0)

  const maxHours = Math.max(...monthly.map(m => m.hours), 1)

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 24 }}>Reports</h1>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <h3>No data yet</h3>
          <p>Log some sessions to see your reports here.</p>
        </div>
      ) : (
        <>
          {/* Totals */}
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 12 }}>All-Time Totals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 36 }}>
            {[
              { label: 'Total Hours', value: totalHours.toFixed(1), icon: '⏱' },
              { label: 'Credit Hours', value: totalCreditHours.toFixed(1), icon: '⭐' },
              { label: 'Sessions', value: sessions.length, icon: '📋' },
              { label: 'Placements', value: totalPlacements, icon: '📚' },
              { label: 'Return Visits', value: totalRVs, icon: '🔁' },
              { label: 'Bible Studies', value: totalBS, icon: '📖' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green-dark)', fontFamily: 'var(--font-display)' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* By ministry type */}
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 12 }}>By Ministry Type</h2>
          <div className="card" style={{ marginBottom: 36, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1.5px solid var(--border-light)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Sessions</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Credit Hrs</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Placements</th>
                </tr>
              </thead>
              <tbody>
                {MINISTRY_TYPES.filter(t => typeTotals[t].count > 0).map((t, i, arr) => (
                  <tr key={t} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600 }}>
                      {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                    </td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--text-secondary)' }}>{typeTotals[t].count}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--green-dark)', fontWeight: 700 }}>{typeTotals[t].hours.toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--amber)', fontWeight: 700 }}>{typeTotals[t].creditHours.toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px' }}>{typeTotals[t].placements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly bar chart */}
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 12 }}>Monthly Hours</h2>
          <div className="card" style={{ marginBottom: 36 }}>
            {monthly.slice(0, 12).map(m => {
              const pct = Math.round((m.hours / maxHours) * 100)
              const label = format(parse(m.month, 'yyyy-MM', new Date()), 'MMM yyyy')
              return (
                <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 72, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, background: 'var(--cream-dark)', borderRadius: 99, height: 22, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--green) 0%, var(--sage) 100%)',
                      height: '100%',
                      borderRadius: 99,
                      minWidth: pct > 0 ? 4 : 0,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                  <div style={{ width: 40, fontSize: 13, fontWeight: 700, color: 'var(--green-dark)', flexShrink: 0 }}>
                    {m.hours.toFixed(1)}h
                  </div>
                </div>
              )
            })}
          </div>

          {/* Monthly detail table */}
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 12 }}>Monthly Summary</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--cream)', borderBottom: '1.5px solid var(--border-light)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Month</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Sessions</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Credit Hrs</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Placements</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>RVs</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>BS</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m, i, arr) => (
                  <tr key={m.month} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600 }}>
                      {format(parse(m.month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                    </td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--text-secondary)' }}>{m.sessions}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--green-dark)', fontWeight: 700 }}>{m.hours.toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px', color: 'var(--amber)', fontWeight: 700 }}>{(m.creditHours || 0).toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px' }}>{m.placements}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px' }}>{m.returnVisits}</td>
                    <td style={{ textAlign: 'right', padding: '11px 16px' }}>{m.bibleStudies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}