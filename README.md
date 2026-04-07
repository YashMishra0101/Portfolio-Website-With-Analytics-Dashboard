# 🧑‍💻 Portfolio + Analytics Dashboard

A production-ready full-stack portfolio system designed for personal use.  
It includes a public portfolio website and a private admin dashboard for managing content and monitoring visitor analytics.

---

## 🧠 Overview

This project is built as a **personal production-level system** to:

- Showcase portfolio content on a public frontend
- Manage and update content through a private dashboard
- Track and analyze visitor activity in real time

It is not intended for public distribution or open-source usage.

---

## ⚙️ Architecture

The system consists of two tightly integrated applications:

### 1. Public Portfolio (Frontend)

- Built using React and Vite
- Fetches portfolio data from Firestore (`portfolio/config`)
- Dynamically renders:
  - Profile
  - Projects
  - Experience
  - Social links
- Tracks visitor sessions and stores them in Firestore (`visits`)

---

### 2. Admin Dashboard (Private)

- Separate application located in `/dashboard`
- Restricted access using Firebase Authentication
- Provides:
  - Content management (edit portfolio data)
  - Analytics dashboard (visitor insights, activity, trends)
- Writes updates directly to Firestore

---

## 🔄 Data Flow

### Content Update Flow

1. Admin updates content via dashboard  
2. Data is written to Firestore (`portfolio/config`)  
3. Frontend listens using real-time listeners (`onSnapshot`)  
4. UI updates instantly without reload  

---

### Analytics Flow

1. Frontend captures visitor metadata (device, OS, referrer)  
2. Data is stored in Firestore (`visits`)  
3. Dashboard reads and visualizes analytics  

---

## ✨ Key Features

- Real-time content synchronization
- Production-level architecture using Firebase
- Visitor tracking and analytics system
- Secure admin dashboard with authentication
- Centralized portfolio configuration
- Scalable and maintainable code structure

---

## 🛠 Tech Stack

### Frontend

- React 19  
- Vite 7  
- Firebase Firestore  
- Tailwind CSS  

### Dashboard

- React 19  
- Vite 7  
- Firebase (Firestore + Auth)  
- React Router  
- Recharts, D3  
- Tailwind CSS  

---

## 🧑‍💻 Setup Instructions

### Prerequisites

- Node.js 18+  
- pnpm  
- Firebase project (Firestore + Auth enabled)  

---

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd My-Portfolio
```

---

### 2. Install Dependencies

```bash
pnpm install
cd dashboard && pnpm install
cd ..
```

---

### 3. Configure Environment Variables

Create `.env` files in both root and dashboard directories:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### 4. Run Application

Frontend:

```bash
pnpm dev
```

Dashboard:

```bash
cd dashboard
pnpm dev
```

---

## 🔐 Security Considerations

- Environment variables must not be committed  
- Access control is enforced via Firebase Authentication  
- Firestore security rules must be properly configured  
- Do not rely only on frontend validation  
- Sensitive operations are restricted to authorized users  

---

## 🛠 Maintenance

- Update portfolio content via dashboard  
- Monitor Firestore collections (`visits`, `admin_logs`)  
- Regularly verify authorized users in `users/{email}`  
- Perform build checks before deployment:

```bash
pnpm lint && pnpm build
cd dashboard && pnpm lint && pnpm build
```

---

## 📌 Note

This is a **personal production-level project** developed for individual use, learning, and continuous improvement.  It is not intended to be used as a public product, SaaS, or open-source solution.