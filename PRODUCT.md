# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two users only — a married couple (husband and wife, post-wedding). Both use mobile phones as their primary device. One user is the admin who creates the household; the partner joins via a one-time invitation link. There are no other user types and no plan to expand beyond two people.

## Product Purpose

Private household management web app that replaces scattered financial records, shopping lists, and task assignments currently living in chat threads, mental notes, and separate spreadsheets. The product eliminates missed bills, forgotten tasks, and unclear spending by consolidating everything into a single shared view.

Success means: both users actively record ≥80% of daily expenses, zero missed bills/taxes after reminders are active, and input takes under 10 seconds.

## Positioning

Not a SaaS product — a single-household private tool. The differentiator is speed-of-input (under 10 seconds to log a transaction from a phone) and shared visibility (both partners see everything, no private mode). The schema includes `household_id` for structural cleanliness, not multi-tenancy.

## Operating Context

- **Daily use:** Quick transaction logging, checking budget status, managing shopping lists collaboratively in real-time while at the store.
- **Weekly use:** Reviewing spending summaries, assigning and completing household chores.
- **Monthly/periodic use:** Checking upcoming bill due dates, reviewing budget adherence, updating savings goals.
- **Notification channel:** Telegram bot for bill reminders (H-3, H-0), budget alerts (80%/100%), and document expiry warnings. WhatsApp via WAHA deferred to Phase 2.
- **Calendar integration:** iCal feed (secret URL) subscribed in Google Calendar for due dates.
- **Environment:** Always-online (no offline support). Mobile-first but works on desktop. Indonesian language, Rupiah currency, WIB timezone.

## Capabilities and Constraints

### Capabilities (Phase 1 / MVP)
- Joint financial tracking: transactions (expense/income/transfer), wallets (cash/bank/e-wallet with calculated balances), customizable categories
- Custom-period budgets: starts on a configurable day (1-28, e.g. payday), per-category limits that carry forward until changed
- Recurring bills: monthly/yearly with configurable reminder days, mark-as-paid with optional auto-transaction
- Savings goals: manual tracking with optional deadline
- Shopping lists: multiple lists, real-time collaborative check-off via Supabase Realtime
- Household tasks: assignee, due date, recurrence, real-time sync
- Document/date reminders: STNK, insurance, passport, warranty expiry
- Telegram bot: account linking via one-time code, reminders for bills/documents/budgets
- CSV export: transactions, budgets, bills
- Audit log: financial module changes tracked (who changed what)
- iCal feed: bills and reminders as calendar events

### Constraints
- **No offline mode:** Web app manifest for home screen install, but no service worker. Requires connection.
- **No private transactions:** All data visible to both users.
- **No bank integration:** Manual entry only; no auto-sync with accounts.
- **No sensitive PII:** No ID numbers, account numbers, or health data in Phase 1.
- **Free tier limits:** Vercel Hobby (cron 1x/day, ±59min precision), Supabase Free (auto-pause after 1 week inactivity, no auto-backup, 500MB).
- **Backup:** Manual `pg_dump` encrypted, stored externally. Must test restore before real financial data.
- **Max 2 members** per household enforced in application logic.

### Undecided
- `period_start_day` value (1-28) — just a setting, does not block development.
- Backup storage location and encryption key management — must decide before real data entry.

## Brand Commitments

- **Name:** Omah (meaning "home" in Javanese)
- **Voice:** Practical, warm, direct — a shared household tool, not a financial advisor.
- **Language:** Indonesian (Bahasa Indonesia)
- **Currency format:** Rupiah (Rp), integer amounts, no decimals.
- **Visual direction:** xAI-inspired dark theme defined in `REQUIREMENT/DESIGN-x.ai.md` — near-black canvas, white pill buttons, Inter + Geist Mono typography. No light mode.
- **Logo/icon:** Not yet created — to be designed.

## Evidence on Hand

- PRD v0.6 with detailed functional requirements (`REQUIREMENT/PRD Sistem Manajemen Keluarga.md`)
- Complete Prisma schema for 16 tables (`REQUIREMENT/schema.prisma`)
- SQL constraints including CHECK, RLS, audit trigger, Realtime policies (`REQUIREMENT/constraints.sql`)
- Prisma config for Supabase connection (`REQUIREMENT/prisma.config.ts`)
- xAI-inspired design system specification (`REQUIREMENT/DESIGN-x.ai.md`)
- No real user data, testimonials, or screenshots yet — product is pre-build.

## Product Principles

1. **Speed over features.** Every interaction must feel instant. Input under 10 seconds. Few features that are actually used beats many that are abandoned.
2. **Shared truth, no hiding.** All data is visible to both partners. Transparency prevents misunderstandings about money and responsibilities.
3. **Remind, don't nag.** Notifications are date-based (H-3, H-0), not hourly. Minimal message content — just the name and date, never sensitive amounts in Telegram.
4. **Data minimalism.** Collect only what's needed. No PII, no account numbers. Sensitive data stays out of unencrypted channels.
5. **Survive neglect.** The system must handle free-tier pauses, missed cron runs, and weeks of inactivity gracefully. Idempotent jobs, keepalive queries, and manual backup with tested restore.

## Accessibility & Inclusion

- Touch targets ≥ 44px (WCAG)
- Adequate color contrast on dark backgrounds
- Component library: shadcn/ui (Radix-based) for accessible primitives
- Keyboard navigable
- Indonesian language only (Phase 1)
