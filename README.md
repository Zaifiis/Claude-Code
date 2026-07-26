# Content OS

A personal **content operating system** — a polished, production-quality web app
for capturing ideas, saving reference videos, writing scripts, running a
production pipeline, scheduling posts, and keeping a searchable library of
everything you want to create.

It is built for the full creator lifecycle:

> Discover → Save reference → Idea → Script → Prepare → Record → Edit →
> Schedule → Post → Track → Repurpose

## Highlights

- **Dashboard** — operational overview: total ideas, ready to post, in
  production, posted this month, saved references, plus a **Content Momentum**
  panel (scripts ready to record, posts scheduled this week, references not yet
  converted, ideas gone stale).
- **Inbox** — extremely fast capture. Paste a URL → it's saved as a reference;
  jot a thought → it's captured as an idea. Nothing gets in your way.
- **Ideas** — every content record, with grid/list views, full filtering
  (platform, status, format, priority, tag, **idea age**) and sorting.
- **Scripts** — a comfortable home for writing, with word counts and status.
- **Content Pipeline** — a drag-and-drop Kanban across the whole workflow
  (Inbox → Idea → Research → Scripting → Ready to Record → Recording → Editing →
  Ready to Post → Scheduled → Posted). Dropping a card updates its status.
- **Calendar** — month/week views of scheduled and posted content, with
  drag-to-reschedule.
- **Content Editor** — a spacious editor with hook, script (word/char count,
  copy button, **autosave**), CTA, notes, tags, references, attachments,
  properties, scheduling, performance metrics, duplicate & **repurpose**.
- **References** — a visual library with safe embedding (a real YouTube player;
  a rich fallback card for everything else), filters and search.
- **Content Library** — published work with its performance.
- **Analytics** — manually-entered metrics with charts (posts/views over time,
  by platform, by format, best performers). Modelled so platform APIs can be
  added later.
- **Command palette** (`⌘/Ctrl + K`), **Quick Add**, global search, keyboard
  shortcuts, toasts, empty states, dark/light/system themes, and a fully
  responsive layout.

## Tech

- **Next.js 16** (App Router, Turbopack, Server Actions) + **React 19** +
  **TypeScript**
- **Tailwind CSS v4** (CSS-first tokens, one restrained accent, excellent dark
  mode)
- **better-sqlite3** — a real, persistent local database (created and seeded on
  first run; zero external services)
- **Framer Motion**, **@dnd-kit** (Kanban + calendar), **cmdk** (palette),
  **sonner** (toasts), **lucide-react**, **next-themes**

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On first run the app creates and seeds a local
SQLite database at `data/content-os.db` with realistic demo content, so you can
explore immediately. To start from scratch, delete the `data/` folder.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Data model

A single relational schema ([`lib/db/schema.sql`](lib/db/schema.sql)) drives
everything:

| Table                 | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `users`               | Local user (auth is out of scope for the local build)|
| `content_items`       | The core record, across its whole lifecycle          |
| `refs`                | Saved reference videos / posts / articles            |
| `content_references`  | Many-to-many: references ⇄ content                   |
| `tags`, `content_tags`, `reference_tags` | Tagging                          |
| `attachments`         | URL-based attachments on a content item              |
| `performance_metrics` | Per-item metrics (views, likes, comments, …)         |

Reads and writes go through a typed query layer
([`lib/db/queries.ts`](lib/db/queries.ts)) and validated **Server Actions**
([`lib/actions`](lib/actions)). The shape mirrors a Postgres design so it can be
ported to Supabase/Postgres for multi-device sync later.

## Reference embedding & safety

The [`ReferenceEmbed`](components/references/reference-embed.tsx) component
detects the platform from a pasted URL, parses YouTube links (including Shorts,
`youtu.be`, `/embed`, `/live`), and renders a **real, lazy-loaded, responsive
player** using a self-constructed `youtube-nocookie` embed URL. Arbitrary
user-provided URLs are **never** placed in an iframe — every other platform gets
a rich fallback card (platform icon, thumbnail when available, and *Open
Original*). The UI never breaks on an un-embeddable link.

## Keyboard shortcuts

| Shortcut        | Action                        |
| --------------- | ----------------------------- |
| `N`             | New idea                      |
| `⌘/Ctrl + K`    | Search / command palette      |
| `⌘/Ctrl + S`    | Save (in the editor)          |
| `⌘/Ctrl + ↵`    | Capture (in the Inbox)        |
| `Esc`           | Close dialog / palette        |

Shortcuts never fire while you're typing in a form field.
