# 🔥 CindR

**Burn through subscriptions, not cash.**

CindR is a privacy-first subscription tracker that lives entirely in your browser. No servers, no accounts, no tracking — your financial data never leaves your device.

**[Try it live →](https://silver-narwhal-35c66e.netlify.app)**

---

## Features

### 📊 Smart Dashboard
- **Monthly & yearly spend** with animated counters
- **Category breakdown** via interactive donut chart
- **Budget gauge** — set a monthly limit, see usage at a glance
- **Worth score** — rate each subscription 1–5 ⭐, average shown on dashboard
- **Lifetime spend** — total of all logged payments

### 📈 Analytics
- **Spending trends** — area chart of monthly spend over time
- **Category donut** — see where your money actually goes
- **Renewal timeline** — upcoming renewals with urgency indicators

### 💰 Subscription Management
- Add, edit, cancel, and delete subscriptions
- **Price change tracking** — detects when you update an amount
- **Payment logging** — mark payments as paid, auto-advances renewal date
- Search and filter (Active / Cancelled / All)
- Multi-currency support (GBP, USD, EUR, AUD, CAD)
- Multiple billing cycles (weekly, monthly, quarterly, yearly, custom)

### 🔒 Privacy & Data
- **Zero-server architecture** — all data stored in IndexedDB
- **Export/import** — JSON backup and restore
- **PWA** — install to your home screen, works offline
- No accounts, no analytics, no tracking

### ✨ UI
- Dark-only premium theme with purple accent
- Glass-morphism cards with hover glow
- Stagger animations on list load
- Smooth tab transitions
- Confetti burst when you cancel a subscription 🎉
- Animated number counters
- Responsive — works on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | TanStack Router |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Storage | IndexedDB |
| Deployment | Netlify |
| Desktop | Tauri (`.exe`) |
| Mobile | Capacitor (iOS / Android) |

---

## Quick Start

```bash
# Clone
git clone https://github.com/ob4cl/subscription-insight.git
cd subscription-insight

# Install
npm install

# Dev server
npm run dev

# Build (SPA)
npm run build:spa

# Deploy to Netlify
npm run deploy:web
```

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main stats dashboard
│   ├── SubscriptionList.tsx   # Searchable subscription list
│   ├── SubscriptionCard.tsx   # Individual subscription display
│   ├── AddSubscriptionForm.tsx # Add/edit modal
│   ├── Analytics.tsx          # Charts container
│   ├── CategoryDonutChart.tsx  # Recharts donut chart
│   ├── SpendingTrendsChart.tsx # Recharts area chart
│   ├── RenewalTimeline.tsx    # Upcoming renewals display
│   ├── BudgetGauge.tsx        # SVG donut budget gauge
│   ├── WorthScoreStars.tsx    # Interactive star rating
│   ├── Confetti.tsx           # Celebration particle effect
│   └── ui/                    # shadcn/ui components
├── hooks/
│   └── useSubscriptions.ts    # React hook for subscription state
├── lib/
│   └── db.ts                  # IndexedDB data layer
├── routes/
│   └── index.tsx              # Main route with tab layout
├── types.ts                   # TypeScript type definitions
└── styles.css                 # Tailwind + design tokens
```

---

## Data Layer

CindR uses **IndexedDB** for all data storage. The database schema:

```
Database: cindr (v2)
├── subscriptions  — keyPath: id, indexes: [nextRenewal, cancelled, category]
├── payments       — keyPath: id, indexes: [subscriptionId, date]
└── settings       — keyPath: key (stores budget config)
```

A pub/sub pattern notifies React components when data changes — no polling needed.

---

## Platforms

CindR is built as a tri-platform app from a single codebase:

| Platform | Command | Output |
|----------|---------|--------|
| **Web** | `npm run deploy:web` | Netlify SPA |
| **Desktop** | `npm run deploy:desktop` | Windows `.exe` (Tauri) |
| **Mobile** | `npm run deploy:mobile` | iOS / Android (Capacitor) |

---

## License

MIT — do whatever you want with it. Just don't blame me if you forget to cancel that gym membership.
