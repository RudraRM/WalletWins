# WalletWins AI

## Overview
WalletWins AI is a fintech web application that helps users understand credit card rewards earned, missed reward opportunities, and smart ways to use available rewards before expiry. Built as a hackathon demo with sample data — no authentication required.

## Recent Changes
- 2026-02-14: Enhanced onboarding with simulated bank connection — after entering card details, shows animated "Connecting to bank" sequence, auto-fetches realistic transactions based on card type, user reviews/edits before analysis
- 2026-02-09: Added Maximum Benefit Categories (redemption suggestions) with fun merchant names, AI Recommended badge, ready-to-redeem vs aspirational split
- 2026-02-08: Replaced 4 cards with 3 (SaveProMax, Swipe&Pray, MidnightSnacks). Moved Rewards Leaked + Expiring Rewards before Cards section. Added Card-MidnightSnacks Digital vs Physical section. Made digital-vs-physical component reusable via cardName prop. Widget-based Missed Opportunities.
- 2026-02-06: Added AI Insights (Win/Tip/Leak types, color-coded), Digital vs Physical section for Card-SaveProMax, Rewards Leak visualization, How WalletWins AI Works section, Demo Mode toggle
- 2026-02-06: Added Statement Reader page at /statements with per-card breakdowns and expandable categories
- 2026-02-06: Added Landing page at /
- 2026-02-06: Initial build — full-stack dashboard with reward summary, credit cards, transactions, insights, missed opportunities, expiring rewards, and charts

## User Preferences
- Modern fintech design language
- Blue/green accents with dark mode default
- Insight-driven, friendly, non-judgmental personality
- Optimize for Insights > Data, Clarity > Features

## Project Architecture
- **Frontend**: React + Vite, TanStack Query, Tailwind CSS, Shadcn UI, Recharts
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Theme**: Inter font, blue/green fintech palette, dark mode default

### Pages
- `/` — Landing page
- `/onboard` — Add your own card and pair transactions (multi-step form)
- `/dashboard` — Main reward dashboard with all sections
- `/statements` — Statement Reader with per-card monthly breakdowns

### Card Names (Demo)
- Card-SaveProMax (blue, +1% digital wallet bonus, travel/groceries focus)
- Card-Swipe&Pray (purple, low reward rates)
- Card-MidnightSnacks (amber, +1% digital wallet bonus, delivery/dining focus)

### Key Files
- `shared/schema.ts` — Data models (creditCards, rewardCategories, transactions w/ paymentMode, rewards, insights)
- `server/routes.ts` — API endpoints (/api/dashboard/summary, /api/cards, /api/categories, /api/transactions, /api/rewards, /api/insights, /api/digital-vs-physical, /api/rewards-leak, /api/redemption-suggestions, /api/statements)
- `server/storage.ts` — Database storage layer with dashboard summary calculation
- `server/seed.ts` — Sample data seeder with fun card names, digital/physical transaction modes
- `server/db.ts` — Drizzle + pg pool setup
- `client/src/pages/landing.tsx` — Landing page
- `client/src/pages/dashboard.tsx` — Main dashboard page with Demo Mode toggle
- `client/src/pages/statements.tsx` — Statement Reader page
- `client/src/components/` — UI components:
  - summary-cards, credit-cards-section, transactions-section (w/ digital/physical badges)
  - insights-section (Win/Tip/Leak types, color-coded green/yellow/red)
  - digital-vs-physical (reusable for Card-SaveProMax and Card-MidnightSnacks, accepts cardName prop)
  - rewards-leak (Earned vs Potential charts, card efficiency, both-card digital/physical breakdown, mode leak KPI)
  - redemption-suggestions (Maximum Benefit Categories with fun merchant names, AI Recommended)
  - how-it-works (4-step explainer)
  - expiring-rewards, reward-chart, missed-opportunities, theme-toggle
- `client/src/lib/theme.tsx` — Dark/light theme provider
