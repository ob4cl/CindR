# CindR 🔥

**Know exactly what you're paying for. Every month.**

[CindR](https://silver-narwhal-35c66e.netlify.app) is a subscription tracker. Add your subscriptions, see your monthly spend, and stop bleeding money on things you forgot about.

---

## Why CindR beats the alternatives

Most subscription trackers fall into two camps — bloated SaaS apps that want your email and credit card, or overengineered self-hosted solutions that need Docker, Postgres, and a weekend to set up.

**CindR has none of that.**

| | CindR | Rocket Money | Bobby | Subscript |
|---|---|---|---|---|
| **Price** | Free | Free (sells your data) | $2.99 | Free (limited) |
| **Account required** | No | Yes | No | Yes |
| **Data leaves your device** | Never | Yes | No | Yes |
| **Open source** | Yes | No | No | No |
| **Charts & analytics** | Yes | Yes | Limited | Yes |
| **PWA (install as app)** | Yes | No | Native only | No |
| **Works offline** | Yes | No | Yes | No |
| **Export your data** | JSON | CSV (manual) | No | CSV |

**The honest truth:** CindR won't cancel subscriptions for you. It won't negotiate your bills. It doesn't have bank integration. What it does: gives you a clean, fast, private dashboard that shows where your money goes. That's it.

---

## What you get

- **Dashboard** — monthly spend, yearly projection, upcoming renewals, budget gauge
- **Charts** — spending trends over time, category breakdown donut
- **Worth score** — rate each subscription 1–5 ⭐, see your average
- **Payment logging** — track when you actually paid, lifetime total
- **Price change tracking** — detects when a sub's price goes up
- **Export/import** — JSON backup, restore on any device
- **PWA** — install to home screen, works offline
- **Dark theme** — it's the only theme. Purple accent. Looks good.

---

## What CindR doesn't do (and won't)

- No bank linking — we don't want your bank credentials
- No auto-cancellation — talk to the company yourself
- No cloud sync — your data lives in your browser's IndexedDB
- No accounts, no logins, no emails, no tracking

---

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · IndexedDB · Capacitor (Android/iOS) · Tauri (Windows) · Netlify (web)

---

## Run it

```bash
git clone https://github.com/ob4cl/CindR.git
cd CindR
npm install
npm run dev
```

**Build for web:** `npm run build:spa`
**Build for Android:** `npm run deploy:android` → open `android/` in Android Studio
**Build for desktop:** `npm run deploy:desktop` (Windows .exe)

---

## License

MIT. Take it, use it, sell it, fork it. Just don't blame me when you realize you've been paying for Duolingo Plus for 18 months without opening the app once.
