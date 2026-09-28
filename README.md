# Content Studio (`/studio`)

A personal dashboard for content ideas: drop an idea in, write the full script,
and track it from raw idea to posted. It is self-contained — no database, no
sign-in, no environment variables — and lives alongside the n8n control panel
described below.

```bash
npm install
cp data/studio.example.json data/studio.json   # optional: start with samples
npm run dev
```

Then open <http://localhost:3000>. With no Supabase credentials configured,
every other route redirects here, so the plain address works — the studio is
also always at <http://localhost:3000/studio>.

## The five stages

Every idea sits at one of five stages, and each stage has its own colour, so a
glance down the list reads as a pipeline:

| Stage | Colour | Means |
| --- | --- | --- |
| Idea | Blue | Captured, nothing written yet |
| Scripted | Indigo | The script is done |
| Recorded | Orange | Filmed, not cut |
| Edited | Teal | Cut and ready to post |
| Posted | Green | Live, with room for a note on how it did |

The sidebar lists them with a live count. **All** is everything still to make,
in the order you intend to make it; **Posted** is the done pile, kept out of
that order. On a phone the sidebar becomes one scrollable row of the same
stages.

## Capturing

**New idea** opens a large, empty box. Type the idea and click anywhere — it
saves and lands in Ideas. Enter and Escape save too, so an idea cannot be lost
by dismissing the wrong way; an empty box just closes.

## The idea page

Tapping a card opens it full screen. The stage selector sits under the title,
and each section carries its own colour:

- **Script** (indigo) — a distraction-free Markdown area with headings and
  bullets, a toolbar, `⌘⌥1` / `⌘⌥2` / `⌘⇧8` shortcuts, a live word count and a
  read-aloud estimate. **Focus** hides everything else; `Esc` steps back out.
- **Hooks** (pink) — opening lines to choose between.
- **Inspiration** (teal) — links to other people's reels, each with a note on
  what to take from it.
- **Shot ideas** (orange) — what to film.
- **Caption** (green) — what goes out with the post.
- **Details** (neutral) — platform, pillar, target date, and more behind a
  disclosure.

Once a card reaches Posted it also gets a **How it did** section for the
performance note.

## Ordering

Inside any stage, drag a card by its handle to change where it sits in the
make-next order — or focus the handle and use the arrow keys (`Home` / `End`
jump to either end). Dragging inside a stage moves the card within the single
global order, so the sequence stays consistent wherever you look at it.

## Everything else

Search covers every written field — script bodies, captions, hooks, shot ideas
and inspiration notes. **Board** and **Calendar**, at the foot of the sidebar,
give a column-per-stage view (drag between columns to change stage) and a month
of target publish dates.

## Where the data lives

**Locally:** one JSON file, `data/studio.json`, written atomically (temp file +
rename) with writes serialised so they cannot interleave. It is gitignored, so
your ideas stay on your machine. Back it up by copying that one file. Point
`STUDIO_DATA_FILE` at another path to keep it elsewhere.

**On Netlify:** a function's filesystem is read-only, so the same data goes to
a [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
store instead — no extra service to sign up for and no keys to manage. Writes
are conditional on the version that was read, so editing on your phone and your
laptop at the same time cannot silently overwrite either one; the write that
loses the race re-reads and re-applies.

Nothing above `lib/studio/backend.ts` knows which of the two is in use. The
choice is made from `NETLIFY_BLOBS_CONTEXT`, which is what the Blobs client
itself reads for its credentials and so is the one signal that means "Blobs
will work here". Set `STUDIO_STORAGE` to `file` or `blobs` as a real
environment variable to override it.

> **Variables in `netlify.toml` reach the build only, never the running site**,
> so storage cannot be configured from there — which is why it is detected
> instead. Anything the running site needs, such as `STUDIO_PASSWORD`, has to
> be set in the Netlify UI with its scope including Functions.

`GET /api/studio/health` reports which store is in use and whether it can be
read, which turns "my idea disappeared" into a specific answer.

A data file written by an earlier version is migrated on load, including the
nine-stage pipeline this app used to have.

## Deploying to Netlify

1. Push the repo and **Add new site → Import an existing project** on Netlify.
   Netlify detects Next.js and needs no build configuration — [`netlify.toml`](netlify.toml)
   only sets `STUDIO_STORAGE=blobs`.
2. **Set a password before the site is live.** Under *Site configuration →
   Environment variables*, add `STUDIO_PASSWORD`. Without it the studio is open
   and anyone with the URL can read and edit your scripts.
3. Deploy, then open the site. You will be asked for the password once per
   device and stay signed in for 30 days. Changing `STUDIO_PASSWORD` signs every
   device out.

The n8n dashboard routes will keep redirecting to the studio unless you also set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> **Locally, leave `STUDIO_PASSWORD` unset** — there is no point locking a
> dashboard that only your own machine can reach.

## Design notes

- One colour per stage and per section, from Apple's system palette. Colour is
  used to identify, never to decorate: a 4px edge on a card, a dot in the
  sidebar, a section heading.
- Colours are semantic tokens defined once in `app/globals.css` and redefined
  for dark mode, so nothing hardcodes a hex value. The appearance switch follows
  the system until you choose, then remembers; the choice is applied before
  first paint so a reload never flashes.
- Spacing sits on an 8pt grid, corner radii come from one shared set, and the
  top bar and popups use a translucent, blurred material.
- Controls clear 44×44pt. The one deliberate exception is the calendar's month
  grid, which is dense by nature and only renders from tablet width up; phones
  get a full-height agenda list instead.
- Motion is short and eased, and honours `prefers-reduced-motion`.

## How it fits with the rest of the repo

`/studio` and `/api/studio` are exempt from the Supabase session gate in
`proxy.ts`, which is why the studio runs with no configuration. The n8n control
panel below still requires a Supabase project and a sign-in.

---

# Content Automation Dashboard (`/`, `/queue`, `/calendar`, `/platforms`)

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
