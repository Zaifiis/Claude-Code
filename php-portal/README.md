# Content OS — PHP portal (zero-setup)

A self-contained content-operations portal (dashboard, pipeline, ideas, scripts,
calendar, reference library, analytics) that runs on **plain PHP** — no Node.js,
no build step, no command line. Built for **Hostinger shared hosting** (any plan
with hPanel).

> Why this exists: the sibling Next.js app needs a persistent Node.js server,
> which Hostinger only offers on Business/Cloud plans. This PHP version runs on
> the PHP that **every** Hostinger web-hosting plan includes, including Premium.

## Just upload it — no database setup needed

By default the app uses **SQLite**, a file-based database built into PHP. You do
**not** create any database, user, password or prefix in hPanel. Upload the
files, open the site, and it creates its database file automatically inside the
(web-protected) `data/` folder and seeds starter content.

Prefer MySQL? It's fully supported — see "Using MySQL instead" below.

Tested end-to-end on **both** SQLite and MySQL/MariaDB: schema creation,
seeding, login, content CRUD, status changes, metrics, and reference embedding
all pass.

---

## What you get

- **Login-gated** single-user workspace (session auth, CSRF-protected forms).
- **Dashboard** with pipeline stats and what's coming up.
- **Pipeline** kanban across 10 workflow stages.
- **Inbox / Ideas / Scripts** filtered work views.
- **Calendar** of everything scheduled.
- **Reference library** — paste any URL; platform, title and thumbnail are
  detected automatically, YouTube links get a safe embed.
- **Analytics** — totals and a top-posts leaderboard from per-post metrics.
- **Full CRUD** on content and references, plus archive/restore/delete.
- Auto-creating schema + realistic starter content on first run.

Requirements: **PHP 8.0+** with `pdo_sqlite` (Hostinger default — nothing to
install). No database server needed in the default mode.

---

## Deploy to Hostinger (hPanel) — ~2 minutes, no database step

### 1. Upload the files
hPanel → **File Manager** → open **`public_html`** → **Upload** the zip →
right-click it → **Extract**. (Extract into `public_html` for the whole domain,
or into a subfolder like `public_html/content` — links auto-adjust.)

### 2. Open the site
Visit your domain. On the first visit the app creates its SQLite database file
and seeds starter content automatically, then shows the login.

- **Default password:** `changeme`
- Sign in → **Settings** → set a real password immediately.
- Delete `_diag.php` and the uploaded `.zip` from `public_html` afterwards.

That's the whole thing — **no database to create, no config to edit, no
terminal, no Node.**

> If you see "Storage folder not writable": in File Manager, right-click the
> `data` folder → Permissions → set it to **755** (or 775). That's the only
> thing SQLite can trip on.

---

## Using MySQL instead (optional)

Only if you specifically want your data in MySQL (e.g. to browse it in
phpMyAdmin):

1. hPanel → **Databases → Management** → create a database + user. Copy the
   **full** name and user (they include a `u123456789_` prefix) and the password.
2. Edit **`config.php`**:
   ```php
   'db_driver' => 'mysql',
   'db_host'   => 'localhost',
   'db_name'   => 'u123456789_yourdb',   // full name incl. prefix
   'db_user'   => 'u123456789_youruser', // full user incl. prefix
   'db_pass'   => 'your-db-password',
   ```
3. Open the site — it creates the tables and seeds automatically.

---

## Notes

- **Diagnostics:** if anything fails, open **`/_diag.php`** — it prints the exact
  cause (PHP version, storage/DB status) and how to fix it. Delete it after.
- **Security:** the `data/` folder (SQLite file), `config.php`, `inc/`, and
  `.sql`/`.sqlite` files are all blocked from direct web access by the included
  `.htaccess` files. Forms are CSRF-protected and all output is escaped.
- **Blank page?** Set `'debug' => true` in `config.php` to see the real error.
- **Backups (SQLite):** download the file `data/content-os.sqlite` from File
  Manager — that single file *is* your entire database.
- **Backups (MySQL):** hPanel → Databases → phpMyAdmin → Export.

## File map

```
config.php        Engine choice (SQLite default) — usually no edits needed
index.php         Dashboard          pipeline.php   Kanban board
inbox.php         Inbox              ideas.php      Ideas
scripts.php       Scripts            calendar.php   Schedule
references.php    Library + CRUD     analytics.php  Metrics
content.php       Item detail        edit.php       Create / edit form
search.php        Search             settings.php   Profile + password
login.php logout.php                 _diag.php      Setup diagnostics (delete after)
data/             SQLite database lives here (web-protected)
inc/              bootstrap, db, schema.sqlite.sql, schema.sql, seed, repo, constants, helpers, layout
assets/style.css  All styling (no framework, no build)
```
