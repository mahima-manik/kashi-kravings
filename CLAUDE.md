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
│   │   ├── layout.tsx          # Header + Chat bubble (async server component, role-aware)
│   │   ├── page.tsx            # Main dashboard (sales overview)
│   │   ├── invoices/page.tsx   # Invoice management
│   │   └── stores/             # Store list + [storeCode] detail
│   └── api/
│       ├── chat/route.ts       # AI chat endpoint (streamText + tools)
│       ├── sales/route.ts      # GET sales data / POST new record / sync from Sheets
│       ├── invoices/route.ts   # GET invoices / POST CSV upload
│       ├── stores/route.ts     # Store CRUD (PATCH also handles password_hash)
│       ├── login/route.ts      # Auth (email login for admin/sales_rep, phone login for store_owner)
│       ├── logout/route.ts
│       ├── me/route.ts         # GET current session role + storeCode
│       ├── store-password/route.ts # POST change store owner password
│       ├── notify/route.ts     # Telegram notifications
│       └── cron/               # Scheduled jobs
├── components/Dashboard/
│   ├── Chat.tsx                # Floating AI chat (useChat from @ai-sdk/react)
│   ├── Header.tsx              # Nav header with theme toggle (accepts role prop, hides nav for store_owner)
│   ├── SummaryCards.tsx         # KPI cards
│   ├── StorePerformance.tsx    # Store performance table
│   ├── SalesChart.tsx          # Revenue/collection chart
│   ├── InvoicesView.tsx        # Invoice list with filters
│   ├── InvoiceTable.tsx        # Invoice data table
│   ├── AgingReport.tsx         # Aging buckets report
│   ├── AgingDistribution.tsx   # Aging chart
│   ├── DateRangePicker.tsx     # Date range selector
│   ├── MetricCard.tsx          # Reusable KPI card (label, value, warn, subtitle)
│   ├── StoreAnalytics.tsx      # Store-level analytics (company_promoter only)
│   ├── StoreDailySalesTable.tsx # Daily sales breakdown table
│   └── index.ts                # Barrel exports
├── lib/
│   ├── types.ts                # All TypeScript interfaces (SalesRecord, Invoice, DashboardData, Firm, etc.)
│   ├── stores.ts               # Store & Product definitions
│   ├── aging.ts                # Aging bucket logic (current, 1-30, 31-60, 61-90, 90+ days)
│   ├── supabase.ts             # Supabase client (uses SUPABASE_URL + SUPABASE_SECRET_KEY)
│   ├── auth.ts                 # Session cookie signing/verification (roles: admin, sales_rep, store_owner)
│   ├── google-sheets.ts        # Google Sheets data fetch + sync to Supabase
│   ├── format.ts               # Number/currency formatting
│   ├── store-intelligence.ts   # Store health metrics (AOV, frequency, trend, health score)
│   └── telegram.ts             # Telegram bot notifications
└── middleware.ts                # Auth middleware (role-based: admin, sales_rep, store_owner)
```

## Database Tables (Supabase)
- `stores` — id, code, name, aliases, created_at, address, contact_name, contact_phone, password_hash
- `sales_records` — daily sales per store (units by product, revenue, collection, TSO count, etc.)
- `invoices` — invoice tracking (invoice_no, contact_name, amount, remaining_amount, status, due_date, firm)
- `users` — auth users with roles (admin, sales_rep)

## Key Patterns
- **Firms**: Two firms — `kashi_kravings` and `prime_traders` (see `FIRMS` in `src/lib/types.ts`)
- **Invoice dates**: Stored as ISO in DB, converted to DD/MM/YYYY for display and aging calculations
- **Aging buckets**: current, 1-30, 31-60, 61-90, 90+ days overdue (see `src/lib/aging.ts`)
- **Sales records**: Originally from Google Sheets, synced to Supabase; DB columns use snake_case
- **Auth**: Cookie-based (`kk-auth`), HMAC-signed session with `SessionPayload` (role, userId, storeCode?). Three roles: `admin` (full access), `sales_rep` (locked to `/sales-entry`), `store_owner` (locked to `/stores/{storeCode}`). Admin/sales_rep login via email, store owners via phone number + password. Middleware redirects unauthenticated users to `/login`.
- **Store Owner Login**: Phone number (from `stores.contact_phone`) + password (bcrypt hash in `stores.password_hash`). Admin sets initial password via store edit form. Store owners can change their own password. Login page has email/phone toggle.
- **AI Chat**: Uses AI SDK v6 `useChat()` hook on client, `streamText()` + `convertToModelMessages()` on server. Tools query Supabase directly.
- **Store Intelligence**: Computed client-side from invoices in `src/lib/store-intelligence.ts`. Metrics: days since last order, order frequency, AOV, revenue trend (3-month MoM), payment reliability (paid/total %), outstanding ratio (remaining/total %), health score (weighted composite 0-100). Used on `/stores` (table + grid views) and `/stores/[storeCode]` detail page.
- **Store detail page URL**: `/stores/[storeCode]` param can be either a store code (e.g. `KK-TRM-01`) or a store name (e.g. `The%20Ram%20Bhandar`). `findStoreCodeLocal()` resolves both to the canonical store code. Always use `canonicalName` (not raw URL param) for filtering invoices/sales.
- **Map iterations**: TypeScript target doesn't support `for...of` on Maps. Use `map.forEach()` or `Array.from(map.entries())` instead.

## Environment Variables
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_SHEETS_*` (for sheet sync)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `AUTH_SECRET` (HMAC signing for session cookies)

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run db:seed-stores` — seed stores table
- `npm run db:migrate-invoices` — migrate invoice data
- `npm run db:backfill-sales` — backfill sales from Sheets to DB
