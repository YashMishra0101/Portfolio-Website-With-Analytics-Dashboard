# Portfolio + Analytics Dashboard

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" alt="Firebase 12" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS 3.4" />
</p>

A modern dual-app portfolio management system with:

- **Public Portfolio** (frontend)
- **Private Admin Dashboard** (analytics + content control)

Originally built for personal use, now open-sourced for learning, customization, and contribution.

## Purpose

- Showcase a personal portfolio on a public frontend.
- Manage portfolio content and monitor visitor activity through a private dashboard.
- Demonstrate a practical full-stack setup using Firebase (Firestore + Auth) with real-time updates.

## How The Website Works

### 1) Frontend (Public Portfolio)

- The public site lives in `src/`.
- It renders portfolio sections (profile, experience, projects, open source contributions, social links, etc.) from Firestore document `portfolio/config`.
- Visitor sessions are logged through `src/utils/analytics.js` into the `visits` collection.

### 2) Dashboard (Admin Panel)

- The dashboard lives in `dashboard/` as a separate Vite app.
- It contains analytics views (`Summary`, `Visitors`, `VisitorManagement`, `OwnerActivity`, `Security`) and a content control UI (`ContentManager`).
- The `ContentManager` edits the same `portfolio/config` document used by the frontend.
- After save, frontend updates through Firestore real-time listeners (`onSnapshot`).

### 3) Content Management Flow

1. Admin updates values in `ContentManager`.
2. Dashboard writes to Firestore using `setDoc` on `portfolio/config`.
3. Frontend receives real-time snapshot updates and re-renders with new values.

### 4) Analytics / Visitor Tracking Flow

1. Frontend captures visitor metadata (device, OS, geo/referrer context).
2. Data is written to Firestore collection `visits`.
3. Dashboard reads and visualizes aggregated and detailed analytics.

## Features

- Live portfolio content management from dashboard.
- Real-time synchronization between dashboard and frontend.
- Visitor analytics dashboard with charts, filters, and session history.
- Visitor and activity operational controls.
- Content Manager for profile text, links, sections, projects, and open-source contributions.
- Role-based behavior (`admin` / `viewer`) in dashboard logic.

## Tech Stack (From Current Codebase)

### Frontend App (`/`)

- React 19
- Vite 7
- Firebase JS SDK 12 (Firestore)
- Tailwind CSS 3.4

### Dashboard App (`/dashboard`)

- React 19
- Vite 7
- Firebase JS SDK 12 (Firestore + Auth)
- React Router DOM 7
- Recharts, React Simple Maps, D3 Geo
- UA Parser JS
- Tailwind CSS 3.4
- Lucide React

## Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm
- Firebase project (Firestore + Auth)

### 1) Clone Repository

```bash
git clone <your-fork-url>
cd My-Portfolio
```

### 2) Install Dependencies

```bash
pnpm install
cd dashboard && pnpm install
cd ..
```

### 3) Configure Environment Variables

This repo reads Firebase values from Vite env vars:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Create `.env` files with these variables:

- Root app: `.env`
- Dashboard app: `dashboard/.env`

Example (`.env`):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4) Run Locally

Run frontend:

```bash
pnpm dev
```

Run dashboard (separate terminal):

```bash
cd dashboard
pnpm dev
```

## Usage Guide

1. Open frontend app to view the public portfolio.
2. Open dashboard app and sign in with authorized credentials.
3. Use `ContentManager` to update portfolio content.
4. Use analytics pages to inspect visitor trends, sources, and devices.

## Security Notes

- Keep all Firebase credentials in `.env` files; never commit real secrets.
- API keys in client apps are not private by design; security must be enforced by Firebase Auth + Firestore rules.
- Do not rely only on frontend role checks; enforce authorization in backend rules.
- Review and minimize visitor data collection based on legal/privacy requirements in your region.
- Replace all personal defaults (name, email, social URLs, location, portfolio content) before deployment.

## Contribution Guidelines

1. Fork the repository.
2. Create a branch: `feat/your-feature-name`.
3. Keep PRs focused and well described.
4. Run lint and build for both apps before opening PR:
   - root: `pnpm lint && pnpm build`
   - dashboard: `cd dashboard && pnpm lint && pnpm build`
5. Open a PR with:
   - concise summary
   - screenshots (if UI changes)
   - test notes

## Disclaimer

This repository contains personal placeholder/default content from the original authoring context.

Before using in production, you must replace:

- Personal identity details (name, email, location, social links)
- Portfolio data (experience, projects, contributions)
- Firebase project configuration and security setup

## License

Released under the custom license available in [`LICENSE`](LICENSE).
