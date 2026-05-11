// src/pages/ContactDetail.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import {
  getContacts, updateContact, deleteContact,
  getNotes, addNote, deleteNote,
  MINISTRY_TYPES, TYPE_LABELS, TYPE_ICONS
} from '../firebase/services'
import { format } from 'date-fns'

export default function ContactDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [notes, setNotes] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  const load = async () => {
    const all = await getContacts(user.uid)
    const found = all.find(c => c.id === id)
    if (!found) { navigate('/contacts'); return }
    setContact(found)
    setForm({
      name: found.name || '',
      ministryType: found.ministryType || 'door-to-door',
      address: found.address || '',
      phone: found.phone || '',
      email: found.email || '',
      placements: found.placements || '',
      bibleStudy: found.bibleStudy || false,
      notes: found.notes || '',
      lastContact: found.lastContact ? format(found.lastContact, 'yyyy-MM-dd') : '',
      nextFollowUp: found.nextFollowUp ? format(found.nextFollowUp, 'yyyy-MM-dd') : '',
      creditHours: found.creditHours || '',
    })
    const n = await getNotes(user.uid, id)
    setNotes(n)
  }

  useEffect(() => { if (user) load() }, [user, id])

 const handleSaveContact = async () => {
    setSaving(true)
    try {
      const cleanForm = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== undefined)
      )
      await updateContact(user.uid, id, cleanForm)
      setEditing(false)
      await load()
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact and all their notes?')) return
    await deleteContact(user.uid, id)
    navigate('/contacts')
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    await addNote(user.uid, id, { text: newNote.trim(), date: format(new Date(), 'yyyy-MM-dd') })
    setNewNote('')
    setAddingNote(false)
    const n = await getNotes(user.uid, id)
    setNotes(n)
  }

  const handleDeleteNote = async noteId => {
    await deleteNote(user.uid, id, noteId)
    setNotes(notes.filter(n => n.id !== noteId))
  }

  if (!contact || !form) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/contacts')}>← Back</button>
        <h1 style={{ fontSize: 26, flex: 1 }}>{contact.name}</h1>
        <span className="badge badge-tan" style={{ fontSize: 16 }}>
          {TYPE_ICONS[contact.ministryType]} {TYPE_LABELS[contact.ministryType]}
        </span>
        {contact.bibleStudy && <span className="badge badge-green">📖 Bible Study</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Contact Info */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17 }}>Contact Info</h2>
            {!editing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); load() }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveContact} disabled={saving}>
                  {saving ? '…' : '✓ Save'}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ministry Type</label>
                <select value={form.ministryType} onChange={e => set('ministryType', e.target.value)}>
                  {MINISTRY_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Contact</label>
                <input type="date" value={form.lastContact} onChange={e => set('lastContact', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Next Follow-up</label>
                <input type="date" value={form.nextFollowUp} onChange={e => set('nextFollowUp', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Placements Given</label>
                <input type="number" min="0" value={form.placements} onChange={e => set('placements', e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input type="checkbox" id="bs2" checked={!!form.bibleStudy} onChange={e => set('bibleStudy', e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor="bs2" style={{ cursor: 'pointer', fontSize: 14 }}>📖 Bible study</label>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              {[
                { label: '📍 Address', val: contact.address, isAddress: true },
                { label: '📞 Phone', val: contact.phone },
                { label: '✉️ Email', val: contact.email },
                { label: '📚 Placements', val: contact.placements ? `${contact.placements} given` : null },
                { label: '🗓 Last contact', val: contact.lastContact ? format(contact.lastContact, 'MMMM d, yyyy') : null },
                { label: '🔔 Next follow-up', val: contact.nextFollowUp ? format(contact.nextFollowUp, 'MMMM d, yyyy') : null },
              ].filter(r => r.val).map(({ label, val, isAddress }) => (
                <div key={label} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
                  {isAddress ? (
                    
                      href={`https://maps.google.com/?q=${encodeURIComponent(val)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--green-dark)', fontWeight: 500 }}
                    >
                      {val}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ textAlign: 'center', background: 'var(--green-light)', border: '1.5px solid var(--sage)' }}>
            <div style={{ fontSize: 32 }}>{TYPE_ICONS[contact.ministryType] || '👤'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--green-dark)', marginTop: 6 }}>
              {contact.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
              Added {contact.createdAt ? format(contact.createdAt, 'MMM d, yyyy') : 'recently'}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="btn btn-secondary" style={{ justifyContent: 'center' }}>📞 Call</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="btn btn-secondary" style={{ justifyContent: 'center' }}>✉️ Email</a>
              )}
              <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete Contact</button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>📝 Notes & Visit Log</h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <textarea
            placeholder="Record what was discussed, literature left, their interests, how the conversation went…"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            style={{ minHeight: 70, flex: 1 }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {addingNote ? '…' : '+ Add Note'}
            </button>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <p>No notes yet. Add your first note above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notes.map(n => (
              <div key={n.id} style={{
                background: 'var(--cream)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                display: 'flex',
                gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {n.createdAt ? format(n.createdAt, 'MMMM d, yyyy · h:mm a') : 'Recent'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {n.text}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={() => handleDeleteNote(n.id)}
                  title="Delete note"
                  style={{ flexShrink: 0, alignSelf: 'flex-start' }}
                >🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}