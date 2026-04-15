<div align="center">

# ⚡ Portfolio Monitoring System

**A production-grade personal portfolio + real-time admin dashboard — built to impress, built to scale.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: Custom](https://img.shields.io/badge/License-Custom-blue.svg)](#license)

</div>

---

## 🧠 What Is This?

A **dual-application system** — a polished public-facing portfolio paired with a private, secure admin dashboard. Every piece of content is managed in real-time, every visitor is tracked, and every login is logged and audited.

> **Note to the Open Source Community** 
> This project was initially built for personal use as a portfolio management system. It has now been open-sourced for learning and contribution. **Important:** If you fork or clone this project for your own use, you MUST replace all personal content, emails, names, and images before deploying to production.

---

## 🌐 Public Portfolio

The public-facing side of the system — fast, dynamic, and content-driven.

- ⚡ **Real-time content** — profile, projects, experience, and socials sync instantly from Firestore
- 📡 **Visitor analytics** — captures device, OS, IP, referrer, and location on every visit
- 🌍 **Multi-source traffic detection** — UTM params, referrers, click IDs, and in-app browsers
- 🎨 **Dark-mode first** — clean bento-grid layout, smooth animations, fully responsive

---

## 🔒 Admin Dashboard

A fully private control panel — gated behind Firebase Auth + a custom two-factor security key.

### 📊 Analytics
- Live visitor count, platform breakdown, country map
- Traffic source attribution (LinkedIn, GitHub, Google, etc.)
- Session timelines and activity trends via Recharts

### 👁 Session History
- Full audit log of every login attempt — device, IP, location, timestamp
- **Active Sessions Counter** — real-time badge showing currently valid sessions
- Role-aware display — admin data is masked for viewer-role users

### 🗂 Content Management
- Edit all portfolio data live — no redeploy required
- Controls: name, bio, projects, experience, tech stack, social links, section visibility

### 👥 Visitor Management
- Browse individual visitor records with geo and device breakdown
- Filter, sort, and inspect any session

### 🛡 Security
- Two-factor login: email/password + role-scoped security key
- All login events logged to `admin_logs` in Firestore
- Session expiry enforced: **30 days** (admin) · **24 hours** (viewer)
- Duplicate session protection via synchronous submit guard

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend UI | React 19, Vite 7, Tailwind CSS |
| Dashboard UI | React 19, Vite 7, Tailwind CSS, Recharts, D3 |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Routing | React Router v6 |
| Device Parsing | ua-parser-js |
| Icons | Lucide React |
| Package Manager | pnpm |

---

## 🔄 How It Works

```
User visits portfolio
       │
       ▼
Analytics captured → Firestore (visits)
       │
       ▼
Admin logs in (email + security key)
       │
       ▼
Login event written → Firestore (admin_logs)
       │
       ▼
Dashboard streams live data via onSnapshot
       │
       ├── Analytics page  → visitor insights
       ├── Session History → audit log + active session count
       └── Content Manager → edits push to Firestore
                                    │
                                    ▼
                         Portfolio frontend updates instantly
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Firebase project with Firestore and Authentication enabled

### 1 · Clone & Replace Personal Data

```bash
git clone <your-repo-url>
cd My-Portfolio
```
> ⚠️ **Crucial Step:** Before proceeding, search the codebase for `yashrkm0101@gmail.com` and replace it with your own admin email. Doing so ensures you receive the correct role and admin privileges. Update the default config in `App.jsx` with your own personal info as well.

### 2 · Install

```bash
pnpm install
cd dashboard && pnpm install && cd ..
```

### 3 · Environment Variables

Create `.env` files in both the root and `/dashboard` directories:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4 · Configure Roles

Set up Firebase Firestore rules for your users. The app expects an `admin_logs` collection and a custom security key setup in `adminSecurityKey/adminKey` or `viewerSecurityKey/viewerKey`.

### 5 · Run

```bash
# Portfolio (root)
pnpm dev

# Dashboard
cd dashboard && pnpm dev
```

---

## 🔐 Security Notes & Customization

- Never commit `.env` files — they are `.gitignore`d
- Firebase security rules must restrict write access appropriately
- The two-factor security key adds a second layer beyond Firebase Auth
- All sensitive admin data is masked from viewer-role sessions

---

## 📄 License & Terms

This project is released under a **Custom License**. You are free to explore, clone, and build upon this code. However, you are **strictly prohibited** from using original names, images, URLs, and personal information contained in this repository. Ensure all personal data is replaced before deploying. See the [LICENSE](./LICENSE) file for complete details.