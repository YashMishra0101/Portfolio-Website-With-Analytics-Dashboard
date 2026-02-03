#  Portfolio Website with Analytics Dashboard

A modern, responsive portfolio website built with React and Vite, featuring a comprehensive admin dashboard for real-time visitor analytics and content management.

## ✨ Features

### Portfolio Website
- **Dark-themed modern design** with smooth animations and glassmorphism effects
- **Responsive layout** optimized for all devices (mobile, tablet, desktop)
- **GitHub Integration** - Live stats including total commits, stars, PRs, and contribution streak
- **Tech Stack showcase** with animated icons
- **Experience & Projects section** with interactive cards
- **Real-time visitor tracking** with geolocation

### Admin Dashboard
- **Real-time Analytics** - Live visitor tracking with charts and graphs
- **Visitor Trend Analysis** - Independent time-range filters (24h, 7d, 15d, 30d, 3m, 6m, 1y)
- **Geographic Distribution** - Interactive world map showing visitor locations
- **Operating System & Device Breakdown** - Pie charts with detailed statistics
- **Traffic Sources** - Track where visitors come from
- **Session History** - Detailed logs of all visitor sessions
- **Visitor Management** - Admin controls for visitor data
- **Content Manager** - Update portfolio content dynamically
- **Role-based Access** - Admin vs Viewer permissions

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool & dev server
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **React Router** - Client-side routing

### Backend & Database
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Authentication** - User authentication

### Other Libraries
- **React Simple Maps** - Geographic visualizations
- **UA Parser JS** - User agent parsing for device detection
- **clsx & tailwind-merge** - Conditional className utilities

## 📁 Project Structure

```
My-Portfolio/
├── src/                    # Portfolio website source
│   ├── App.jsx            # Main portfolio component
│   ├── index.css          # Global styles
│   └── utils/
│       └── analytics.js   # Visitor tracking logic
├── dashboard/             # Admin dashboard (separate app)
│   └── src/
│       ├── pages/
│       │   ├── Summary.jsx         # Main analytics dashboard
│       │   ├── Analytics.jsx       # Detailed statistics
│       │   ├── Visitors.jsx        # Recent visitors list
│       │   ├── Security.jsx        # Session history
│       │   ├── VisitorManagement.jsx
│       │   ├── ContentManager.jsx  # CMS for portfolio
│       │   └── Login.jsx           # Authentication
│       └── components/
├── public/                # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YashMishra0101/My-Portfolio.git
   cd My-Portfolio
   ```

2. **Install dependencies for portfolio**
   ```bash
   pnpm install
   ```

3. **Install dependencies for dashboard**
   ```bash
   cd dashboard
   pnpm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the portfolio**
   ```bash
   pnpm dev
   ```

6. **Run the dashboard** (in a separate terminal)
   ```bash
   cd dashboard
   pnpm dev
   ```

## 🌐 Deployment

Both the portfolio and dashboard are configured for Vercel deployment:

- **Portfolio**: Deployed at your main domain
- **Dashboard**: Deployed at a subdomain (e.g., `admin.yourdomain.com`)

## 📊 Dashboard Features

### Analytics Dashboard
- Real-time visitor count with live updates
- Time-range filters: Total, 24h, 7d, 15d, 30d, 3m, 6m, 1y
- KPIs: Views, Desktop %, Mobile %, Top Country

### Visitor Trend Graph
- Independent time-range filter (default: 30 days)
- Interactive area chart with gradient fill
- Responsive design

### Data Sections
- **Operating Systems** - Donut chart with legend
- **Top Locations** - Bar chart of countries
- **Traffic Sources** - Horizontal bar chart

### Security & Logs
- Session history with timestamps
- Device info, browser, OS detection
- IP-based geolocation (privacy-focused)

## 🔒 Security

- Firebase Authentication for admin access
- Role-based permissions (Admin/Viewer)
- Sensitive data masking for non-admin users
- HTTPS-only geolocation APIs

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Yash Mishra**
- GitHub: [@YashMishra0101](https://github.com/YashMishra0101)
- LinkedIn: [Yash Mishra](https://www.linkedin.com/in/yash-mishra-356280223/)
- Twitter: [@YashRKMishra1](https://x.com/YashRKMishra1)

---

⭐ Star this repo if you find it helpful!
