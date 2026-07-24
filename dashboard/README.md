# Content Automation Dashboard

A control panel for the n8n content automation pipeline. Replaces the Google
Sheet as the backend: both this dashboard and n8n read/write the same Supabase
(Postgres) database.

```
┌─────────────┐         ┌───────────────────┐         ┌───────────────┐
│  Dashboard  │ ──────▶ │  Supabase (PG)    │ ◀────── │  n8n workflow │
│  (Next.js)  │  read/  │  platforms        │  read/  │  generate +   │
│             │  write  │  content_items    │  write  │  publish      │
└─────────────┘         │  platform_settings│         └───────┬───────┘
                        └───────────────────┘                 │
                                                              ▼
                                              LinkedIn / (Twitter, IG, FB later)
```

## What the dashboard does

- **Overview** — per-platform counts of Pending / Ready / Posted content and recent activity.
- **Queue** — review posts n8n generated (`Pending`), edit the text, then
  **Approve** (sets `Ready` — the publish workflow only picks up `Ready` items)
  or **Reject**.
- **Calendar** — month view of scheduled and posted content across platforms.
- **Platforms** — toggle each platform on/off and edit its brand-voice prompt
  and cron cadences. n8n reads this before generating.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/schema.sql` from this repo. This
   creates `platforms`, `platform_settings`, `content_items`, and seeds
   LinkedIn (enabled) plus Twitter/Instagram/Facebook (disabled).
3. In **Authentication → Users**, create your login user (email + password).
   There is intentionally no public sign-up.

### 2. Dashboard

```bash
cd dashboard
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL + ANON KEY
npm install
npm run dev                  # http://localhost:3000
```

Deploy: push to GitHub and import into [Vercel](https://vercel.com) — set the
same two env vars in the Vercel project settings. (Any Node host works; Vercel
is just the least friction for Next.js.)

### 3. n8n

1. In n8n, create a **Postgres credential** using your Supabase connection
   info: **Project Settings → Database → Connection string** (use the
   *Session pooler* / port 5432 variant; SSL required). This connection
   bypasses RLS, which is what n8n needs.
2. Import `n8n/workflow.json` (repo root). It is the same pipeline as before
   with the four Google Sheets nodes replaced:

   | Old (Sheets)            | New (Postgres)                                    |
   |-------------------------|---------------------------------------------------|
   | Get Past Ideas (read)   | `SELECT title FROM content_items ...`             |
   | Save Post (append)      | `INSERT INTO content_items ... status='Pending'`  |
   | Get Ready Posts (filter)| `SELECT ... WHERE status='Ready'`                 |
   | Update Status (update)  | `UPDATE content_items SET status='Posted' ...` by id |

3. Point each Postgres node at the credential you created (the JSON references
   a placeholder credential named "Supabase Postgres account").
4. Google Drive (image storage), OpenAI, and LinkedIn credentials are unchanged.

### The daily loop

1. **8:00** — n8n generates a post + image, inserts it as `Pending`.
2. **You** — open the Queue, edit if needed, click **Approve & mark Ready**.
3. **9:00** — n8n publishes everything `Ready`, marks it `Posted` with a timestamp.

Nothing goes out without passing through the Queue.

## Adding more platforms

The schema and workflow are already multi-platform:

1. **Platforms page** — flip the platform on and write its brand voice prompt.
2. **n8n** — the publish workflow has a **Platform Router** switch node with
   outputs for twitter / instagram / facebook that are not yet connected.
   Add the platform's publish node (e.g. the X node, or Facebook Graph API
   HTTP request) and connect it to the matching router output, ending in the
   same `Update Status` node.
3. **Generation** — duplicate the generation branch per platform, or make it
   loop over enabled platforms and interpolate
   `platform_settings.brand_voice_prompt` into the Idea Generator prompt.

## Notes / current limitations

- Images still live in Google Drive (the workflow saves the `webContentLink`
  into `content_items.image_url`). Moving them to Supabase Storage would drop
  the Google dependency entirely.
- The cron fields on the Platforms page are stored config; n8n's Schedule
  Trigger nodes don't read them automatically. Treat them as the source of
  truth you mirror into the trigger settings (n8n has no built-in way to drive
  trigger schedules from a DB row).
- Old rows in the Google Sheet are not migrated automatically. If you want the
  history, export the sheet as CSV and import it into `content_items` via the
  Supabase table editor.
