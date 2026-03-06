# Kashi Kravings Dashboard

Internal business dashboard for Kashi Kravings, a paan & Indian sweets company. Built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Supabase**, and **Recharts**.

## Tech Stack
- Next.js 14 (App Router, `src/` directory)
- TypeScript, Tailwind CSS
- Supabase (Postgres) via `@supabase/supabase-js` — client at `src/lib/supabase.ts`
- AI Chat: `ai@6` (AI SDK v6) + `@ai-sdk/openai` + `@ai-sdk/react` + `zod@4`
- Charts: Recharts

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider)
│   ├── login/page.tsx          # Login page
│   ├── sales-entry/            # Sales rep entry form (restricted role)
│   ├── (dashboard)/            # Admin dashboard (route group)
│   │   ├── layout.tsx          # Header + Chat bubble
│   │   ├── page.tsx            # Main dashboard (sales overview)
│   │   ├── invoices/page.tsx   # Invoice management
│   │   └── stores/             # Store list + [storeCode] detail
│   └── api/
│       ├── chat/route.ts       # AI chat endpoint (streamText + tools)
│       ├── sales/route.ts      # GET sales data / POST new record / sync from Sheets
│       ├── invoices/route.ts   # GET invoices / POST CSV upload
│       ├── stores/route.ts     # Store CRUD
│       ├── login/route.ts      # Auth
│       ├── logout/route.ts
│       ├── notify/route.ts     # Telegram notifications
│       └── cron/               # Scheduled jobs
├── components/Dashboard/
│   ├── Chat.tsx                # Floating AI chat (useChat from @ai-sdk/react)
│   ├── Header.tsx              # Nav header with theme toggle
│   ├── SummaryCards.tsx         # KPI cards
│   ├── StorePerformance.tsx    # Store performance table
│   ├── SalesChart.tsx          # Revenue/collection chart
│   ├── InvoicesView.tsx        # Invoice list with filters
│   ├── InvoiceTable.tsx        # Invoice data table
│   ├── AgingReport.tsx         # Aging buckets report
│   ├── AgingDistribution.tsx   # Aging chart
│   ├── DateRangePicker.tsx     # Date range selector
│   └── index.ts                # Barrel exports
├── lib/
│   ├── types.ts                # All TypeScript interfaces (SalesRecord, Invoice, DashboardData, Firm, etc.)
│   ├── stores.ts               # Store & Product definitions
│   ├── aging.ts                # Aging bucket logic (current, 1-30, 31-60, 61-90, 90+ days)
│   ├── supabase.ts             # Supabase client (uses SUPABASE_URL + SUPABASE_SECRET_KEY)
│   ├── auth.ts                 # Session cookie signing/verification
│   ├── google-sheets.ts        # Google Sheets data fetch + sync to Supabase
│   ├── format.ts               # Number/currency formatting
│   └── telegram.ts             # Telegram bot notifications
└── middleware.ts                # Auth middleware (role-based: admin vs sales_rep)
```

## Database Tables (Supabase)
- `stores` — id, code, name, aliases, created_at, address
- `sales_records` — daily sales per store (units by product, revenue, collection, TSO count, etc.)
- `invoices` — invoice tracking (invoice_no, contact_name, amount, remaining_amount, status, due_date, firm)
- `users` — auth users with roles (admin, sales_rep)

## Key Patterns
- **Firms**: Two firms — `kashi_kravings` and `prime_traders` (see `FIRMS` in `src/lib/types.ts`)
- **Invoice dates**: Stored as ISO in DB, converted to DD/MM/YYYY for display and aging calculations
- **Aging buckets**: current, 1-30, 31-60, 61-90, 90+ days overdue (see `src/lib/aging.ts`)
- **Sales records**: Originally from Google Sheets, synced to Supabase; DB columns use snake_case
- **Auth**: Cookie-based (`kk-auth`), middleware redirects unauthenticated users to `/login`
- **AI Chat**: Uses AI SDK v6 `useChat()` hook on client, `streamText()` + `convertToModelMessages()` on server. Tools query Supabase directly.

## Environment Variables
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_SHEETS_*` (for sheet sync)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `COOKIE_SECRET`

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run db:seed-stores` — seed stores table
- `npm run db:migrate-invoices` — migrate invoice data
- `npm run db:backfill-sales` — backfill sales from Sheets to DB
