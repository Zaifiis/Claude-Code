# Content Automation Dashboard

A control panel for the n8n content-automation pipeline. It replaces the Google
Sheet that the workflow used to read and write, giving you a real UI to:

- **Overview** — per-platform counts of Pending / Ready / Posted content.
- **Queue** — review what n8n generated, edit the copy, then approve (→ `Ready`)
  or reject. Approving is what makes the publish workflow pick a post up.
- **Calendar** — a month view of scheduled and posted content across platforms.
- **Platforms** — turn each platform on/off and set the brand-voice prompt and
  posting cadence the workflow uses. LinkedIn is enabled by default; X/Twitter,
  Instagram and Facebook are seeded but disabled, ready to wire up later.

The dashboard and n8n share **one Supabase Postgres database**. n8n writes rows;
the dashboard reads and edits them; n8n reads them back. Neither talks to the
other directly — the database is the single source of truth.

```
┌──────────────┐        writes / updates       ┌──────────────┐
│     n8n      │ ───────────────────────────▶  │              │
│  workflow    │                               │   Supabase   │
│ (Postgres    │ ◀───────────────────────────  │   Postgres   │
│  nodes)      │        reads Ready posts       │              │
└──────────────┘                               └──────┬───────┘
                                                      │ reads / edits
                                               ┌──────▼───────┐
                                               │  Dashboard   │
                                               │ (Next.js)    │
                                               └──────────────┘
```

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates the `platforms`, `platform_settings`, and
   `content_items` tables, seeds the four platforms, and enables Row Level
   Security. (A successful run reports "Success. No rows returned" — that's
   expected; the script only creates and inserts.)
3. Go to **Authentication → Users → Add user** and create yourself an email +
   password. This is your dashboard login — there is intentionally no public
   sign-up page.

## 2. Run the dashboard

```bash
cd dashboard
cp .env.example .env.local
```

Fill `.env.local` from **Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and log in with the user from step 1.

## 3. Point n8n at the same database

The updated workflow lives at [`../n8n/workflow.json`](../n8n/workflow.json). It is
the original workflow with the four Google Sheets nodes replaced by Postgres
nodes (plus a new **Get Platform** node that reads the enabled platform and its
brand-voice prompt from the dashboard).

1. In n8n: **Credentials → New → Postgres**. Fill it from **Supabase → Project
   Settings → Database → Connection info** (use the **Session pooler** host,
   port `5432`, database `postgres`, your DB password, SSL enabled). This
   connection uses the service role and bypasses RLS, which is what n8n needs.
2. **Workflows → Import from File** → select `n8n/workflow.json`.
3. Open each of the five Postgres nodes — **Get Platform, Get Past Ideas, Save
   Post, Get Ready Posts, Update Status** — and select the credential you just
   created. (Their credential IDs are placeholders on purpose.)
4. The OpenAI, Google Drive, and LinkedIn nodes keep their original credential
   IDs, so they should reconnect automatically on your instance. Re-select them
   if not.

### How the columns map

The Sheet's columns became `content_items` columns. A few were renamed:

| Old sheet column | New DB column |
| ---------------- | ------------- |
| `text`           | `post_text`   |
| `image`          | `image_url`   |
| `Status`         | `status`      |
| `Date`           | `created_at` (set automatically) |

`status` is an enum: `Pending` → `Ready` → `Posted` (or `Rejected`). The
generation workflow inserts rows as `Pending`; you approve them to `Ready` in
the dashboard; the publish workflow flips them to `Posted`.

## 4. Test the round trip

1. Run the **generation** workflow manually (top schedule). A new card should
   appear in the dashboard **Queue** as `Pending`.
2. Edit and **Approve** it — status becomes `Ready`.
3. Run the **publish** workflow manually (bottom schedule). It publishes the
   `Ready` post to LinkedIn and sets it to `Posted`; it now shows on the
   **Calendar**.

Once that works, **deactivate your old Google-Sheets workflow** so you don't get
double posts.

## 5. Deploy (optional)

Deploy the dashboard to [Vercel](https://vercel.com) so you can approve posts
from your phone:

1. Import your GitHub repo.
2. Set **Root Directory** to `dashboard`.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   env vars.
4. Deploy.

## Adding more platforms later

The schema already seeds `twitter`, `instagram`, and `facebook` (disabled). To
turn one on:

1. Enable it on the **Platforms** page and set its brand voice.
2. In n8n, duplicate the LinkedIn generate/publish branches, change the
   **Get Platform** / **Get Ready Posts** queries to that platform's `slug`, and
   swap the final **Publish Post** node for that platform's node (e.g. the X or
   Facebook Graph node). The `content_items` table already carries a
   `platform_id`, so the dashboard picks the new platform up with no changes.

> **Note:** publishing to Instagram/Facebook needs a Meta (Facebook Ads / Graph)
> connection, and X needs an X/Twitter credential — those are authorized
> separately in n8n when you get to them.

## Tech notes

- Next.js 16 (App Router). Auth session refresh runs in `proxy.ts` (Next 16
  renamed `middleware.ts` → `proxy.ts`).
- Supabase Auth via `@supabase/ssr`. All dashboard routes are gated; the only
  public route is `/login`.
- Server Actions (`app/(dashboard)/**/actions.ts`) perform all writes and
  `revalidatePath` the affected pages.
