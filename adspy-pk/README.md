# AdSpy PK — Pakistan Facebook Ads Tracker

A full-stack SaaS application that automatically discovers trending products being advertised in Pakistan by scanning the Facebook Ads Library daily. Built for dropshippers, e-commerce entrepreneurs, and product researchers.

## Features

- **Daily Auto-Sync** — Cron job scans 10 keyword categories every night at midnight PKT
- **Trending Score** — Products ranked by ad count, unique advertisers, and recency
- **9 Categories** — Beauty, Fashion, Electronics, Health, Home, Food, Education, Real Estate, Make Money
- **Duplicate Detection** — Each Facebook ad ID stored once; stale ads auto-deactivated after 3 days
- **Real-Time Search** — Search Facebook Ads Library live from the app
- **Save & Export** — Bookmark products with notes; CSV export (PRO plan)
- **Admin Panel** — User management, sync logs, manual sync trigger
- **FREE / PRO plans** — Rate limiting enforced per plan

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL via Prisma ORM v7 |
| Auth | NextAuth.js v4 (Google OAuth + credentials) |
| UI | Tailwind CSS v4 + Radix UI primitives |
| Charts | Recharts |
| Cron | Vercel Cron Jobs |
| Deploy | Vercel (app) + Railway (PostgreSQL) |

## Setup

### 1. Clone and install
```bash
git clone <repo>
cd adspy-pk
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```

Fill in all values in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | Direct pg connection (bypasses Prisma proxy) |
| `NEXTAUTH_SECRET` | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `FB_ACCESS_TOKEN` | Facebook Ads Library access token |
| `CRON_SECRET` | Secret to protect the sync endpoint |

### 3. Run migrations and seed
```bash
npm run db:push     # push schema to database
npm run db:seed     # seed with 50 products + test users
```

### 4. Run development server
```bash
npm run dev
```

Visit `http://localhost:3000`.

**Test accounts:**
- Admin: `admin@adspypk.com` / `admin123`
- Free: `free@adspypk.com` / `user123`
- Pro: `pro@adspypk.com` / `user123`

---

## Getting a Facebook Access Token

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app (type: Business)
2. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
3. Select your app from the dropdown
4. Click **Generate Access Token**
5. Add permission: `ads_read`
6. Copy the token and paste into `FB_ACCESS_TOKEN` in `.env`

**Long-lived token (recommended):**
```
GET https://graph.facebook.com/v20.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_TOKEN}
```

---

## How the Cron Job Works

The sync runs at `0 19 * * *` UTC (midnight PKT).

1. Loops through 10 search keywords (`"buy online pakistan"`, `"cash on delivery"`, etc.)
2. For each keyword fetches up to 200 ads from the Facebook Ads Library API
3. For each new ad: extracts product name via NLP, detects category, finds or creates the Product record
4. Recalculates `trendingScore = (adCount × 0.5) + (advertiserCount × 2) + recencyBonus`
5. Marks ads not updated in 3 days as `INACTIVE`
6. Logs result to `SyncLog` table

**Manual trigger** (Admin only):
```
GET /api/cron/sync
Header: x-cron-secret: <CRON_SECRET>
```

---

## Deployment

### Vercel (Frontend + API)
1. Push repo to GitHub
2. Import to Vercel
3. Add all env vars in Vercel project settings
4. `vercel.json` already configures the daily cron

### Railway (PostgreSQL)
1. Create new project → Add PostgreSQL service
2. Copy the `DATABASE_URL` from Railway dashboard
3. Paste into Vercel env vars
4. Run `npx prisma db push` pointing to Railway DB
5. Run `npm run db:seed` to populate initial data

---

## Project Structure

```
adspy-pk/
├── prisma/
│   ├── schema.prisma      # DB schema
│   └── seed.ts            # Seed script (50 products, 3 users, 10 sync logs)
├── src/
│   ├── app/
│   │   ├── (auth)/        # login, register pages
│   │   ├── (dashboard)/   # dashboard, products, saved, search, admin, settings
│   │   ├── api/           # all API routes
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── dashboard/     # Sidebar, Header, ProductCard
│   │   └── ui/            # Button, Card, Badge, Input, etc.
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── facebook-ads.ts # FB API + product extraction
│   │   ├── prisma.ts      # Prisma client singleton
│   │   └── utils.ts       # Formatters, helpers
│   └── proxy.ts           # Auth proxy (replaces middleware)
├── vercel.json            # Cron job config
└── .env.example           # Environment variable template
```
