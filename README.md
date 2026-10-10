# WalletWins

WalletWins imports posted credit card purchases from CSV and OFX statement exports, lets the user review transactions and category reward rates, and compares estimated rewards across tracked cards.

## Development

Requirements: Node.js 20 or newer, npm, and PostgreSQL.

```sh
npm ci
export DATABASE_URL="postgresql://user:password@localhost:5432/walletwins"
npm run db:push
npm run dev
```

The development server listens on port 5000 by default. `npm run check` runs TypeScript checking and `npm run build` creates the production client and server in `dist/`.

## Importing statements

Open `/onboard` and select a `.csv`, `.ofx`, or `.qfx` statement export (up to 10 MB). CSV files need date, description/merchant, and amount columns; debit and credit columns are also recognized. The original file is parsed in the browser. Review purchases, adjust categories, and enter the card's reward rate for each category before importing. Re-imported rows matching the same card, date, merchant, and amount are skipped.

The import flow saves parsed transaction rows to the configured PostgreSQL database. It does not connect to a bank, extract rewards from statements, or infer card-specific bonus rates. Category assignments use statement categories when they match supported categories and otherwise use merchant-name heuristics; review them before importing.

## Data and deployment

The app no longer creates example cards or transactions on startup. Configure the database schema with `npm run db:push` before starting the app. Existing records from earlier demo versions are left in place; back up and remove any unwanted sample rows manually.

There is no sign-in or per-user data isolation yet. API endpoints are unauthenticated and all records in one database are visible to the deployment's users. Only use real statement data on an instance you control until authentication and user-level data isolation are added.

## Application routes

- `/` — Product overview
- `/onboard` — Statement upload, review, and import
- `/dashboard` — Spending and estimated reward comparisons
- `/statements` — Spending breakdown by card and category

The dashboard estimates rewards from category rates the user enters. It does not provide financial advice or guarantee rewards from a card issuer.
