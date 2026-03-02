# Kashi Kravings Dashboard — Design Document

## Overview

Internal business dashboard for Kashi Kravings, a paan/thandai/gilori brand sold across stores in Varanasi. Tracks daily sales (via Google Forms → Sheets), invoices (via MyBillBook CSV exports), and store-level performance.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · Google Sheets API · Recharts

---

## Authentication

Simple cookie-based auth. No external provider.

- Login page: `/login`
- Credentials stored in `.env.local` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- On success: sets `kk-auth=authenticated` cookie
- Middleware (`src/middleware.ts`) protects all routes except `/login` and `/api/*`

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Main dashboard — summary cards, charts, date range filter |
| `/invoices` | Invoice table — CSV upload, search, filter by status |
| `/stores` | All stores — grouped by invoice contact, shows dues |
| `/stores/[storeCode]` | Store detail — invoices tab + daily sales tab |
| `/chat` | AI chat over sales + invoice data |

---

## Data Sources

### 1. Sales — Google Forms → Google Sheets → Supabase

TSOs submit daily sales via a Google Form. Responses land in a Google Sheet ("Form Responses 1").

**Flow:**
- Dashboard loads → reads `sales_records` table from Supabase
- "Sync from Sheets" button → fetches all rows from Google Sheets → upserts into `sales_records` → returns fresh data
- Normal date-range changes → read from DB only (no Sheets call)

**Google Sheet columns (0-indexed):**

| Index | Field |
|---|---|
| 0 | Timestamp (form submission time) |
| 1 | Date (sale date) |
| 2 | Store code (e.g. KK-TRM-01) |
| 3–5 | Paan L, Thandai L, Gilori L |
| 6–8 | Paan S, Thandai S, Gilori S |
| 9–10 | Heritage Box (9), Heritage Box (15) |
| 11 | Sale Value |
| 12 | Collection Received |
| 13 | Sample Given |
| 14 | Number of TSOs |
| 15 | Promotion Duration (hours) |
| 16 | Sample Consumed |

### 2. Invoices — MyBillBook CSV → Supabase

Invoices are exported from MyBillBook as a CSV and uploaded via the dashboard UI.

**Flow:**
- User exports CSV from MyBillBook → uploads via `/invoices` page
- `POST /api/invoices` parses CSV, maps `contact_name` to `store_id`, upserts into `invoices` table
- `GET /api/invoices` reads from Supabase, returns sorted list + aggregated totals

**Expected CSV columns:**
```
Invoice No, Invoice Date, Contact Name, Amount, Remaining Amount,
Invoice Status, Due Date, Invoice Link, Payment Type, Party Category, Created By
```
- Date format in CSV: `DD/MM/YYYY`
- Dates stored in DB as ISO `YYYY-MM-DD`
- Dates returned by API as `DD/MM/YYYY` (for backward compatibility with UI components)
- Header row must start with `"Invoice No"`

---

## Database Schema (Supabase / Postgres)

### `stores`
```sql
CREATE TABLE stores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,   -- e.g. "KK-TRM-01"
  name       TEXT NOT NULL,          -- e.g. "The Ram Bhandar"
  aliases    TEXT[],                 -- alternate invoice contact name spellings
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current stores (9):**

| Code | Name | Aliases |
|---|---|---|
| KK-TRM-01 | The Ram Bhandar | |
| KK-LC-02 | Lakshmi Chai | |
| KK-DC-06 | Deena Chaat | |
| KK-SJ-03 | Shree Ji | Shreeji |
| KK-BL-04 | Blue Lassi | |
| KK-SL-05 | Siwon Lassi | |
| KK-PBC-07 | Popular Baati Chokha | Popular Baati |
| KK-GB-08 | GreenBerry | Greenberry, Green Berry |
| KK-RB-09 | Rahul Brothers | |

### `invoices`
```sql
CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no       TEXT UNIQUE NOT NULL,
  invoice_date     DATE NOT NULL,
  contact_name     TEXT NOT NULL,       -- raw name from MyBillBook
  store_id         UUID REFERENCES stores(id),  -- nullable; mapped from contact_name
  amount           NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL,       -- 'Paid' | 'Unpaid'
  due_date         DATE,
  invoice_link     TEXT,
  payment_type     TEXT,                -- 'credit' | 'cash'
  party_category   TEXT,
  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales_records`
```sql
CREATE TABLE sales_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at         TIMESTAMPTZ NOT NULL UNIQUE,  -- Google Forms submission timestamp
  date                DATE NOT NULL,
  store_id            UUID REFERENCES stores(id),
  store_code          TEXT NOT NULL,                -- raw store code from sheet
  paan_l              INTEGER DEFAULT 0,
  thandai_l           INTEGER DEFAULT 0,
  gilori_l            INTEGER DEFAULT 0,
  paan_s              INTEGER DEFAULT 0,
  thandai_s           INTEGER DEFAULT 0,
  gilori_s            INTEGER DEFAULT 0,
  heritage_box_9      INTEGER DEFAULT 0,
  heritage_box_15     INTEGER DEFAULT 0,
  sale_value          NUMERIC(12,2) DEFAULT 0,
  collection_received NUMERIC(12,2) DEFAULT 0,
  sample_given        INTEGER DEFAULT 0,
  num_tso             INTEGER DEFAULT 0,
  promotion_duration  NUMERIC(6,2) DEFAULT 0,
  sample_consumed     INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON sales_records(date);
CREATE INDEX ON sales_records(store_id);
```

**Key design notes:**
- `recorded_at` is the unique conflict key — prevents duplicate form submissions
- `store_code` preserves raw value from sheet; `store_id` is the FK join to `stores`
- Products are columns, not a separate table — product catalog is fixed and driven by Google Form structure
- No `updated_at` on `sales_records` — rows are immutable once submitted

---

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/sales` | Read sales from DB, filtered by `startDate`/`endDate` |
| GET | `/api/sales?sync=true` | Fetch from Google Sheets → upsert DB → return fresh data |
| GET | `/api/sales?mock=true` | Return generated mock data (dev/fallback) |
| GET | `/api/invoices` | Read all invoices from DB |
| POST | `/api/invoices` | Upload MyBillBook CSV → upsert invoices into DB |
| POST | `/api/chat` | AI chat using sales + invoice data as context |
| POST | `/api/login` | Validate credentials, set auth cookie |
| POST | `/api/logout` | Clear auth cookie |
| POST | `/api/notify` | Send Telegram message |
| GET | `/api/cron/daily-summary` | Vercel Cron — send daily Telegram summary at 9 PM IST |

---

## Key Source Files

| File | Purpose |
|---|---|
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/stores.ts` | Store definitions, aliases, `findStoreCode()` helper |
| `src/lib/supabase.ts` | Shared Supabase client (server-side, uses secret key) |
| `src/lib/google-sheets.ts` | Sheets fetching, row parsing, aggregation helpers, `buildDashboardData()` |
| `src/middleware.ts` | Cookie-based auth protection |
| `src/app/api/sales/route.ts` | Sales API — DB reads + Sheets sync |
| `src/app/api/invoices/route.ts` | Invoices API — DB reads + CSV upsert |

---

## One-Time Scripts

Run with `npx tsx scripts/<file>.ts` or via npm scripts.

| Script | npm command | Purpose |
|---|---|---|
| `scripts/seed-stores.ts` | `npm run db:seed-stores` | Insert 9 stores into DB |
| `scripts/migrate-invoices.ts` | `npm run db:migrate-invoices` | Migrate `invoices.json` → DB |
| `scripts/backfill-sales.ts` | `npm run db:backfill-sales` | Backfill all Google Sheets data → DB |

---

## Environment Variables

```env
# Google Sheets
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEET_ID=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Supabase
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=   # client-side safe
SUPABASE_SECRET_KEY=        # server-side only

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# OpenAI (chat feature)
OPENAI_API_KEY=
```

---

## Products

Fixed catalog — 8 SKUs driven by Google Form structure. Stored as columns in `sales_records`.

| Name | Flavor | Size |
|---|---|---|
| Paan (L) | Paan | L |
| Thandai (L) | Thandai | L |
| Gilori (L) | Gilori | L |
| Paan (S) | Paan | S |
| Thandai (S) | Thandai | S |
| Gilori (S) | Gilori | S |
| Heritage Box (Set of 9) | — | Gift Box |
| Heritage Box (Set of 15) | — | Gift Box |

---

## Store–Invoice Mapping

Invoice `contact_name` from MyBillBook doesn't always match store names exactly. `findStoreCode()` in `stores.ts` does a case-insensitive prefix match including aliases to resolve `contact_name` → store `code`. The resolved `store_id` (UUID) is stored on each invoice row in the DB.

Unmapped contacts (e.g. one-off cash sales) have `store_id = NULL` and are visible in the invoice table but excluded from store-level analytics.
