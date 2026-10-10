<div align="center">
  <img src="public/icons/icon.svg" alt="Omahku Logo" width="80" height="80" />
  <h1>Omahku — Open-Source Private Family Management System</h1>
  <p><strong>A self-hosted, mobile-first household operating system for couples. Seamlessly manage joint finances, shopping checklists, daily chores, document vaults, and automated renewal reminders.</strong></p>

  <p>
    <a href="#key-features">Features</a> •
    <a href="#quickstart">Quickstart</a> •
    <a href="#self-hosting">Self-Hosting</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>

  <p>
    <a href="https://github.com/coderey-tf/project-omah/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-006241.svg?style=flat-square" alt="License: MIT" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js" alt="Next.js 16" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7.10-2D3748?style=flat-square&logo=prisma" alt="Prisma 7" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://github.com/coderey-tf/project-omah/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
  </p>
</div>

---

## 💡 Why Omahku?

Managing household finances and domestic responsibilities with spreadsheets, disjointed chat threads, or complicated enterprise expense trackers often leads to friction:
- **Commercial apps** are bloated with ads, require paid multi-user subscriptions, or demand invasive bank-linking permissions.
- **Generic to-do apps** lack household financial context (budgeting periods, bill confirmation, asset service tracking).
- **Manual spreadsheets** are slow on mobile devices, making daily expense tracking inconsistent.

**Omahku** (Javanese for *"My Home"*) is purposefully designed as a lightweight, private, self-hosted web app built exclusively for **two partners (Husband & Wife / Couples)**. It focuses on speed (<10 seconds to log an expense), shared transparency, and elegant daily habits.

---

## ✨ Key Features

### 💰 Household Finance & Custom Budgets
- **Sub-10s Expense Logging:** Fast, mobile-optimized quick-add modal with smart defaults (current date, last-used wallet).
- **PWA Web Share Target & AI Receipt Scanner:** Share payment proofs directly from **myBCA**, QRIS, or mobile banking apps into Omahku; automatically parsed using free Google Gemini Flash Vision AI (amounts, merchants, wallets, categories pre-filled in seconds).
- **Dynamic Wallet Balances:** Math-driven balance calculation (`opening_balance + sum(active_tx)`) ensuring zero database drift.
- **Payday-Aligned Budget Periods:** Set your household budget cycle starting from your actual payday (e.g. 25th of each month) instead of rigid calendar months.
- **Recurring Bills & 1-Click Settlement:** Track monthly/yearly utilities (WiFi, electricity, maintenance) with cycle payment status and automatic expense creation.
- **Interactive Cashflow Line Chart:** Responsive Catmull-Rom Bezier SVG curve visualizing income vs. expenses with hover details.
- **Shared Savings Goals:** Visual progress bars for joint family milestones (vacation fund, emergency savings, home renovation).

### 🛒 Real-time Shopping & Domestic Tasks
- **Shared Grocery List:** Instant real-time checklist powered by Supabase Realtime Channels. What you check off at the market syncs to your partner's phone in seconds.
- **Chore Delegation & Recurrence:** Assign tasks to yourself or your partner with recurring schedules (daily, weekly, monthly).

### 🛡️ Private Family Vault & Asset Registry
- **Encrypted Document Vault (`/vault`):** Private digital copies of IDs (KTP, Family Cards, Passports), vehicle titles (BPKB/STNK), land deeds, and insurance policies.
- **Asset, Warranty & Maintenance Log (`/assets`):** Catalog household valuables, electronics warranties, and vehicle service histories.
- **Social Ledger / Angpao Tracker (`/kondangan`):** Digital log of gift envelopes received and given during family and friends' celebrations.
- **Weekly Meal Planner (`/meals`):** Plan breakfast, lunch, and dinner for the week and push ingredients straight to your grocery shopping list with one tap.

### 🔔 Smart Multi-Channel Notifications
- **Telegram Bot Integration:** Daily 08:00 AM reminders for upcoming bills (H-3 and H-0) and expiration dates, with interactive commands (`/saldo`, `/tagihan`, `/tugas`, `/belanja`).
- **WhatsApp Gateway (WAHA):** Connect your WhatsApp numbers to receive notifications and check household statuses via natural WhatsApp chat commands.
- **iCal Subscription Feed:** Sync household bill due dates and document renewals directly into Google Calendar, Apple Calendar, or Outlook via a secure private feed URL.

---

## 🎨 Design System: *Starbucks Heritage Edition*

Omah features a warm, calming aesthetic tailored for daily use without visual fatigue:
- **House Green (`#1E3932`)** — Timeless dark forest green for primary typography and brand identity.
- **Starbucks Green (`#006241`)** — Signature accent green for buttons, active indicators, and success states.
- **Warm Canvas (`#F2F0EB`)** — Soothing, eye-friendly off-white background.
- **Warm Gold & Bronze (`#CBA258` / `#C87A54`)** — Highlighting budget alerts, deadlines, and expense curves.
- **Delicate Card Elevating & Smooth Radii** — `12px` to `16px` rounded corners with dual-layer soft elevation.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client[📱 Mobile Browser / PWA] -->|HTTPS / WSS| App[⚡ Next.js 16 App Router]
    App -->|Prisma 7 + PG Driver Adapter| DB[(🐘 Supabase PostgreSQL)]
    App -->|Realtime Channels| RT[⚡ Supabase Realtime]
    App -->|Session Cookie / Auth| Auth[🔐 Supabase Auth]
    App -->|Private Storage| Storage[📦 Supabase Storage]
    Cron[⏰ Vercel Cron / Daily 08:00 WIB] -->|Secret Authorized GET| App
    App -->|HTTPS Webhook / REST| TG[🤖 Telegram Bot API]
    App -->|REST API| WAHA[💬 WAHA WhatsApp Gateway]
```

| Layer | Technology | Details |
|---|---|---|
| **Frontend & SSR** | Next.js 16 (App Router) | React Server Components, Server Actions, Route Protection Proxy |
| **Styling** | Tailwind CSS v4 | Custom Starbucks Heritage color tokens, responsive utilities |
| **ORM & Database** | Prisma 7 + PostgreSQL | `@prisma/adapter-pg` connection pooler, custom SQL constraints |
| **BaaS Platform** | Supabase | Free-tier compatible PostgreSQL, Realtime WebSocket, Storage |
| **Notification Engine**| Telegram Bot API & WAHA | Multi-channel broadcast dispatcher with idempotent logging |
| **Deployment** | Vercel | Vercel Cron, Edge runtime optimizations |

---

## 🚀 Quickstart (Local Development)

### 1. Prerequisites
- **Node.js** `20.x` or higher
- **pnpm** `9.x` or higher (`npm install -g pnpm`)
- A free **[Supabase](https://supabase.com/)** PostgreSQL project

### 2. Clone and Install
```bash
git clone https://github.com/coderey-tf/project-omah.git
cd project-omah
pnpm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file:
```bash
cp .env.example .env
```
Fill in your Supabase connection strings and secrets in `.env`:
```env
# Supabase PostgreSQL Database (Transaction Pooler & Direct)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Public API & Auth
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Vercel Cron Secret (Secures /api/cron/daily)
CRON_SECRET="your-secure-cron-secret"

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_USERNAME="YourFamilyBot"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# WhatsApp Gateway via WAHA (Optional)
WAHA_BASE_URL="http://localhost:3008"
WAHA_API_KEY="your-waha-api-key"
```

### 4. Push Database Schema
```bash
pnpm prisma migrate dev
```

### 5. Start Development Server
```bash
pnpm dev
```
Open **`http://localhost:3000`** in your browser.

> **⚡ Rapid Testing Tip:**  
> If you haven't configured Supabase email authentication yet, you can test all features immediately by clicking **"⚡ Masuk Cepat Akun Testing (Admin / Demo)"** on the `/login` screen.

---

## 🐳 Running WhatsApp Gateway (WAHA) with Docker (Optional)

To enable WhatsApp notifications and two-way interactive commands:

```bash
docker compose -f docker-compose.waha.yml up -d
```
1. Open the WAHA Dashboard at `http://localhost:3008/dashboard`.
2. Scan the QR code with your dedicated WhatsApp bot number.
3. Link your number on Omah's `/settings` page.

---

## 🚢 Production Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the repository into **[Vercel](https://vercel.com)**.
3. Configure the environment variables in your Vercel project settings matching your production Supabase instance.
4. Vercel will automatically detect `vercel.json` and schedule the daily reminder cron at 08:00 AM WIB (`01:00 UTC`).

---

## 🤝 Contributing

Contributions, feature ideas, and bug reports are welcome!

1. Fork the Project (`https://github.com/coderey-tf/project-omah/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. Copyright (c) 2026 **CODEREY STUDIO**. See [`LICENSE`](LICENSE) for more details.

---

<div align="center">
  <p>Built with ❤️ by <strong>CODEREY STUDIO</strong> for happy and organized households.</p>
</div>
