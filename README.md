# 🌿 Ministry Tracker

A personal ministry tracking app built with React, Firebase, and Netlify.

## Features

- **Dashboard** — Monthly at-a-glance stats and upcoming follow-ups
- **Sessions** — Log door-to-door, return visits, Bible studies, phone, letter writing, and cart witnessing with hours, placements, and notes
- **Contacts** — Track people you've met with addresses, phone/email, follow-up dates, and visit notes
- **Reports** — Monthly summaries, all-time totals, and breakdown by ministry type

---

## Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Firestore Database** (start in test mode for now)
3. Enable **Authentication** → Sign-in methods → enable **Anonymous**
4. Go to Project Settings → Your apps → click Web icon → register app → copy config values

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Firebase values in `.env`.

### 3. Firestore security rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Install and run locally

```bash
npm install
npm run dev
```

---

## Deploy to Netlify

### Option A: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Set environment variables in Netlify Dashboard → Site → Environment variables (add all `VITE_FIREBASE_*` keys).

### Option B: Connect Git repo

1. Push this project to GitHub
2. In Netlify: New site → Import from Git → select your repo
3. Build command: `npm run build`, Publish directory: `dist`
4. Add all `VITE_FIREBASE_*` environment variables in Site Settings → Environment variables
5. Deploy!

---

## Data Structure (Firestore)

```
users/
  {uid}/
    sessions/
      {sessionId}/
        type, date, hours, placements, returnVisits, bibleStudies, notes, createdAt
    contacts/
      {contactId}/
        name, ministryType, address, phone, email, lastContact, nextFollowUp,
        placements, bibleStudy, notes, createdAt
        notes/
          {noteId}/
            text, date, createdAt
```
