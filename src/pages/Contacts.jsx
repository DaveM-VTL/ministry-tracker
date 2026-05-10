// src/pages/Contacts.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import { getContacts, addContact, deleteContact, MINISTRY_TYPES, TYPE_LABELS, TYPE_ICONS } from '../firebase/services'
import { format } from 'date-fns'

const EMPTY = {
  name: '', ministryType: 'door-to-door', address: '', phone: '', email: '',
  lastContact: format(new Date(), 'yyyy-MM-dd'), nextFollowUp: '',
  placements: '', bibleStudy: false, notes: '',
}

function ContactModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)
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
          <h2>Add Contact</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
          </div>

          <div className="form-group">
            <label>Ministry Type</label>
            <select value={form.ministryType} onChange={e => set('ministryType', e.target.value)}>
              {MINISTRY_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address or area" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Last Contact</label>
              <input type="date" value={form.lastContact} onChange={e => set('lastContact', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Next Follow-up</label>
              <input type="date" value={form.nextFollowUp} onChange={e => set('nextFollowUp', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Placements given</label>
            <input type="number" min="0" placeholder="0" value={form.placements} onChange={e => set('placements', e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <input type="checkbox" id="bs" checked={form.bibleStudy} onChange={e => set('bibleStudy', e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="bs" style={{ cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>
              📖 Conducting a Bible study with this person
            </label>
          </div>

          <div className="form-group">
            <label>Initial Notes</label>
            <textarea placeholder="Interests, conversation highlights, what literature was left…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '✓ Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Contacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const load = async () => {
    setLoading(true)
    const data = await getContacts(user.uid)
    setContacts(data)
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const handleSave = async form => {
    await addContact(user.uid, form)
    await load()
  }

  const handleDelete = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this contact and all their notes?')) return
    await deleteContact(user.uid, id)
    await load()
  }

  const filtered = contacts
    .filter(c => filterType === 'all' || c.ministryType === filterType)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 26 }}>Contacts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Contact</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Search by name or address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="all">All Types</option>
          {MINISTRY_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No contacts found</h3>
          <p>{contacts.length === 0 ? 'Add your first contact to start tracking.' : 'Try adjusting your search or filter.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <Link key={c.id} to={`/contacts/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', height: '100%' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.address}</div>
                  </div>
                  <span className="badge badge-tan">{TYPE_ICONS[c.ministryType]}</span>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {TYPE_LABELS[c.ministryType] || c.ministryType}
                </div>

                {c.bibleStudy && (
                  <span className="badge badge-green" style={{ marginBottom: 8 }}>📖 Bible Study</span>
                )}

                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  {c.lastContact && (
                    <span>Last: {format(c.lastContact, 'MMM d')}</span>
                  )}
                  {c.nextFollowUp && (
                    <span style={{ color: 'var(--amber)' }}>Follow-up: {format(c.nextFollowUp, 'MMM d')}</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={e => handleDelete(e, c.id)}
                    title="Delete contact"
                  >🗑</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <ContactModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
