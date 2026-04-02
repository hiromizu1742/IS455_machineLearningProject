# IS455 Shop Analytics — Web App

A customer order management and late delivery prediction dashboard backed by an ML pipeline.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Select Customer | `/customers` | Browse and select a customer |
| Dashboard | `/customers/[id]` | Order summary for the selected customer |
| Order History | `/customers/[id]/orders` | All past orders |
| New Order | `/customers/[id]/new-order` | Order form — saves to database |
| Priority Queue | `/priority-queue` | Top 50 shipments ranked by late delivery risk |

---

## Tech Stack

### Frontend + Backend
| Technology | Role | Why we chose it |
|------------|------|-----------------|
| **Next.js 16** (App Router) | Frontend + server in one | Single framework, deploys to Vercel in one command |
| **TypeScript** | Type-safe JavaScript | Catches bugs at compile time |
| **React 19** | UI components | Bundled with Next.js |
| **Server Actions** | Server-side DB logic | No separate API server needed |

### Database
| Technology | Role |
|------------|------|
| **Supabase Postgres** | Production relational database |
| **`pg`** | Node.js PostgreSQL driver |

### ML Integration
| Technology | Role |
|------------|------|
| **Python 3** + `scoring_script.py` | Runs the ML model and writes predictions back to the DB |

---

## Packages

### Production (`dependencies`)

| Package | Version | What it does |
|---------|---------|--------------|
| `next` | 16.x | Framework core |
| `react` | 19.x | UI library |
| `react-dom` | 19.x | Renders React to the DOM |
| `pg` | latest | Reads and writes Postgres from Node.js |

### Development (`devDependencies`)

| Package | What it does |
|---------|--------------|
| `typescript` | TypeScript compiler |
| `@types/node` | Type definitions for Node.js |
| `@types/react` | Type definitions for React |
| `@types/react-dom` | Type definitions for ReactDOM |
| `@types/pg` | Type definitions for pg |
| `eslint` | Code linting tool |
| `eslint-config-next` | Next.js ESLint rules |

---

## Database Schema (`shop.db`)

```
customers    (250 rows)   Customer profiles
orders       (5,000 rows) Order records
shipments    (5,000 rows) Shipment records  ← ML model writes late_delivery_prob here
order_items  (15,022 rows) Line items per order
products                  Product catalog
product_reviews           Customer reviews
```

**Column written by the ML model:**
```sql
shipments.late_delivery_prob  -- REAL, range 0.0–1.0 (predicted probability of late delivery)
```

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Supabase Postgres URL
# .env.local
DATABASE_URL=postgresql://...

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

Press `Ctrl + C` to stop.

---

## How ML Scoring Works

### Flow

```
[Browser]  Click "Run Scoring" button
     ↓
[Next.js Server Action]  Calls external ML scoring API
     ↓
[ML API]  Writes late_delivery_prob to shipments table in Supabase
     ↓
[Browser]  Priority queue auto-refreshes
```

### Key Files

| File | Role |
|------|------|
| `components/RunScoringButton.tsx` | Button UI |
| `actions/scoring.ts` | Server-side scoring trigger — **edit this to switch modes** |
| `scoring_script.py` | Local ML inference script (placeholder — replace with your model) |

---

## Switching to an External ML API

When your teammate publishes their trained model as an API endpoint, you only need to update **one file and one env variable**. No other changes required.

### Step 1 — Add the API URL to `.env.local`

```bash
# .env.local
ML_API_URL=https://your-teammate-api.vercel.app/score
```

### Step 2 — Restart the dev server

```bash
npm run dev
```

That's it. `actions/scoring.ts` automatically detects `ML_API_URL` and calls the API instead of running the local Python script.

- **`ML_API_URL` is set** → calls the external API
- **`ML_API_URL` is empty** → falls back to `scoring_script.py` locally

### On Vercel (production)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add:

```
ML_API_URL = https://your-teammate-api.vercel.app/score
```

---

## Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Log in
vercel login

# 3. Deploy (press Enter for all prompts on first run)
vercel --prod
```

Submit the URL printed after deployment.

> Add `DATABASE_URL` in Vercel Project Settings -> Environment Variables.

---

## Supabase Migration (for Vercel)

If you want a persistent production database on Vercel, export `shop.db` to Postgres SQL and load it into Supabase.

```bash
# From project root
npm run db:export:supabase
```

This generates:

- `supabase/01_schema.sql` (tables and constraints)
- `supabase/02_seed.sql` (data inserts)

Load order in Supabase SQL Editor:

1. Run `01_schema.sql`
2. Run `02_seed.sql`

You can also point to a different database or output folder:

```bash
python scripts/sqlite_to_supabase.py --db path/to/shop.db --out supabase
```

---

## Project Structure

```
IS455/
├── app/
│   ├── layout.tsx                        # Shared nav layout
│   ├── page.tsx                          # Redirects / → /customers
│   ├── customers/
│   │   └── page.tsx                      # Customer list
│   ├── customers/[customerId]/
│   │   ├── page.tsx                      # Dashboard
│   │   ├── orders/page.tsx               # Order history
│   │   └── new-order/page.tsx            # New order form
│   └── priority-queue/
│       └── page.tsx                      # Late delivery priority queue
├── actions/
│   ├── customers.ts                      # Customer queries
│   ├── orders.ts                         # Order queries and creation
│   └── scoring.ts                        # Scoring trigger (API or local script)
├── components/
│   └── RunScoringButton.tsx              # Run Scoring button
├── lib/
│   └── db.ts                             # Postgres connection singleton
├── types/
│   └── index.ts                          # Shared TypeScript interfaces
├── shop.db                               # Source SQLite data (migration input)
└── scoring_script.py                     # Placeholder ML script
```

---

## Assignment Checklist

- [x] Select Customer screen (no login required)
- [x] Customer dashboard with order summaries
- [x] Create a new order and save to database
- [x] Order history page
- [x] Late Delivery Priority Queue (top 50 by predicted probability)
- [x] Run Scoring button that triggers ML inference and refreshes the queue
