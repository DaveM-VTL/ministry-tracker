// src/pages/Sessions.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../App'
import {
  getSessions, addSession, updateSession, deleteSession,
  MINISTRY_TYPES, TYPE_LABELS, TYPE_ICONS
} from '../firebase/services'
import { format } from 'date-fns'

const EMPTY = {
  type: 'door-to-door',
  date: format(new Date(), 'yyyy-MM-dd'),
  hours: '',
  placements: '',
  returnVisits: '',
  bibleStudies: '',
  notes: '',
}

function SessionModal({ session, onClose, onSave }) {
  const [form, setForm] = useState(session || EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{session ? 'Edit Session' : 'Log Session'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ministry Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} required>
              {MINISTRY_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Hours</label>
              <input type="number" step="0.25" min="0" placeholder="e.g. 2.5" value={form.hours} onChange={e => set('hours', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Placements</label>
              <input type="number" min="0" placeholder="0" value={form.placements} onChange={e => set('placements', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Return Visits</label>
              <input type="number" min="0" placeholder="0" value={form.returnVisits} onChange={e => set('returnVisits', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Bible Studies</label>
            <input type="number" min="0" placeholder="0" value={form.bibleStudies} onChange={e => set('bibleStudies', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea placeholder="Any observations or highlights from this session…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '✓ Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const load = async () => {
    setLoading(true)
    const data = await getSessions(user.uid)
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const handleSave = async form => {
    if (editing) {
      await updateSession(user.uid, editing.id, form)
    } else {
      await addSession(user.uid, form)
    }
    await load()
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this session?')) return
    await deleteSession(user.uid, id)
    await load()
  }

  const filtered = filterType === 'all' ? sessions : sessions.filter(s => s.type === filterType)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>Sessions</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          + Log Session
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {[{ key: 'all', label: 'All Types' }, ...MINISTRY_TYPES.map(t => ({ key: t, label: `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}` }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            style={{
              padding: '5px 14px',
              borderRadius: 99,
              border: '1.5px solid',
              borderColor: filterType === key ? 'var(--green)' : 'var(--border)',
              background: filterType === key ? 'var(--green-light)' : 'var(--white)',
              color: filterType === key ? 'var(--green-dark)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No sessions yet</h3>
          <p>Click "Log Session" to record your first ministry session.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICONS[s.type] || '📋'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{TYPE_LABELS[s.type] || s.type}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {s.date ? format(s.date, 'EEEE, MMMM d, yyyy') : '—'}
                </div>
                {s.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>{s.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-dark)' }}>{s.hours}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>hrs</div>
                </div>
                {Number(s.placements) > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>{s.placements}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>placed</div>
                  </div>
                )}
                {Number(s.returnVisits) > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}>{s.returnVisits}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RVs</div>
                  </div>
                )}
                {Number(s.bibleStudies) > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{s.bibleStudies}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BS</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary btn-icon btn-sm"
                  onClick={() => { setEditing(s); setShowModal(true) }}
                  title="Edit"
                >✏️</button>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={() => handleDelete(s.id)}
                  title="Delete"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SessionModal
          session={editing ? { ...editing, date: editing.date ? format(editing.date, 'yyyy-MM-dd') : '' } : null}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
