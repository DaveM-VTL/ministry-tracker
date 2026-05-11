// src/firebase/services.js
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, where, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from './config'

// ── Sessions ────────────────────────────────────────────────────────────────
export const MINISTRY_TYPES = [
  'door-to-door',
  'return-visits',
  'bible-studies',
  'phone',
  'letter-writing',
  'cart-witnessing',
]

export const TYPE_LABELS = {
  'door-to-door': 'Door-to-Door',
  'return-visits': 'Return Visits',
  'bible-studies': 'Bible Studies',
  'phone': 'Phone Witnessing',
  'letter-writing': 'Letter Writing',
  'cart-witnessing': 'Cart Witnessing',
}

export const TYPE_ICONS = {
  'door-to-door': '🚪',
  'return-visits': '🔁',
  'bible-studies': '📖',
  'phone': '📞',
  'letter-writing': '✉️',
  'cart-witnessing': '🛒',
}

// Sessions collection
export async function addSession(userId, data) {
  return addDoc(collection(db, 'users', userId, 'sessions'), {
    ...data,
    createdAt: Timestamp.now(),
    date: Timestamp.fromDate(new Date(data.date + 'T12:00:00')),
  })
}

export async function getSessions(userId) {
  const q = query(
    collection(db, 'users', userId, 'sessions'),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() }))
}

export async function updateSession(userId, sessionId, data) {
  const ref = doc(db, 'users', userId, 'sessions', sessionId)
  return updateDoc(ref, data)
}

export async function deleteSession(userId, sessionId) {
  return deleteDoc(doc(db, 'users', userId, 'sessions', sessionId))
}

// ── Contacts ────────────────────────────────────────────────────────────────
export async function addContact(userId, data) {
  return addDoc(collection(db, 'users', userId, 'contacts'), {
    ...data,
    createdAt: Timestamp.now(),
    lastContact: data.lastContact ? Timestamp.fromDate(new Date(data.lastContact)) : null,
    nextFollowUp: data.nextFollowUp ? Timestamp.fromDate(new Date(data.nextFollowUp)) : null,
  })
}

export async function getContacts(userId) {
  const q = query(
    collection(db, 'users', userId, 'contacts'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    lastContact: d.data().lastContact?.toDate(),
    nextFollowUp: d.data().nextFollowUp?.toDate(),
    createdAt: d.data().createdAt?.toDate(),
  }))
}

export async function updateContact(userId, contactId, data) {
  const ref = doc(db, 'users', userId, 'contacts', contactId)
  const updates = { ...data }
  if (data.lastContact) updates.lastContact = Timestamp.fromDate(new Date(data.lastContact))
  if (data.nextFollowUp) updates.nextFollowUp = Timestamp.fromDate(new Date(data.nextFollowUp))
  return updateDoc(ref, updates)
}

export async function deleteContact(userId, contactId) {
  return deleteDoc(doc(db, 'users', userId, 'contacts', contactId))
}

// ── Notes ───────────────────────────────────────────────────────────────────
export async function addNote(userId, contactId, data) {
  return addDoc(collection(db, 'users', userId, 'contacts', contactId, 'notes'), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function getNotes(userId, contactId) {
  const q = query(
    collection(db, 'users', userId, 'contacts', contactId, 'notes'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }))
}

export async function deleteNote(userId, contactId, noteId) {
  return deleteDoc(doc(db, 'users', userId, 'contacts', contactId, 'notes', noteId))
}

// ── Monthly summary helpers ─────────────────────────────────────────────────
export function summariseByMonth(sessions) {
  const map = {}
  sessions.forEach(s => {
    if (!s.date) return
    const key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { hours: 0, creditHours: 0, placements: 0, returnVisits: 0, bibleStudies: 0, sessions: 0 }
    map[key].hours += Number(s.hours || 0)
    map[key].creditHours += Number(s.creditHours || 0)
    map[key].placements += Number(s.placements || 0)
    map[key].returnVisits += Number(s.returnVisits || 0)
    map[key].bibleStudies += Number(s.bibleStudies || 0)
    map[key].sessions++
  })
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, data]) => ({ month, ...data }))
}
