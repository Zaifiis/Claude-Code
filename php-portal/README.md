# Content OS — PHP + MySQL portal

A self-contained content-operations portal (dashboard, pipeline, ideas, scripts,
calendar, reference library, analytics) that runs on **plain PHP + MySQL** — no
Node.js, no build step, no command line. Built to run on **Hostinger shared
hosting (Premium / Business / Cloud plans with hPanel)**.

> Why this exists: the sibling Next.js app needs a persistent Node.js server,
> which Hostinger only offers on Business/Cloud plans. This PHP version runs on
> the PHP + MySQL that **every** Hostinger web-hosting plan includes, including
> Premium. Same features, different engine.

It has been tested end-to-end against MySQL/MariaDB: schema creation, seeding,
login, content CRUD, status changes, metrics, and reference embedding all pass.

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

Requirements: **PHP 8.1+** with `pdo_mysql` (Hostinger default) and a MySQL
database. Nothing else.

---

## Deploy to Hostinger (hPanel) — ~5 minutes

### 1. Create a MySQL database
hPanel → **Databases → Management**. Create a database and a user (hPanel shows
them prefixed, e.g. `u123456789_contentos`). Note the **database name**, **user**
and **password**. Assign the user to the database (All Privileges).

### 2. Upload the files
hPanel → **File Manager**. Upload the **contents of this `php-portal/` folder**
into where you want the site to live:
- whole site at your domain root → upload into `public_html/`
- under a subfolder → e.g. `public_html/content/` (the app auto-detects the
  subfolder, links still work).

You can drag-and-drop the files, or upload a zip and **Extract** it in File
Manager. (You don't need `preview-*.png` — those are just screenshots.)

### 3. Enter your database details
Edit **`config.php`** in File Manager and set:

```php
'db_host' => 'localhost',              // Hostinger: always localhost
'db_name' => 'u123456789_contentos',   // from step 1
'db_user' => 'u123456789_contentos',   // from step 1
'db_pass' => 'your-db-password',       // from step 1
```

### 4. Open the site
Visit your domain (or the subfolder URL). On the first visit the app creates all
tables and seeds starter content automatically, then shows the login screen.

- **Default password:** `changeme`
- Sign in, go to **Settings**, and set a real password immediately.

That's it — no build, no terminal, no Node.

---

## Notes

- **Security:** `config.php`, the `inc/` folder and `.sql` files are blocked from
  direct web access by the included `.htaccess` (honoured by Hostinger's
  LiteSpeed). Forms are CSRF-protected and all output is escaped.
- **Environment variables (optional):** instead of editing `config.php` you can
  set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` in hPanel; those win over the
  file values.
- **Blank page after upload?** Temporarily set `APP_DEBUG=1` (env var) or
  `'debug' => true` in `config.php` to see the real error — almost always a
  database credential typo.
- **Backups:** your data lives entirely in the MySQL database. Back it up from
  hPanel → Databases → phpMyAdmin → Export.

## File map

```
config.php        ← the only file you edit
index.php         Dashboard          pipeline.php   Kanban board
inbox.php         Inbox              ideas.php      Ideas
scripts.php       Scripts            calendar.php   Schedule
references.php    Library + CRUD     analytics.php  Metrics
content.php       Item detail        edit.php       Create / edit form
search.php        Search             settings.php   Profile + password
login.php logout.php                 .htaccess      Hardening
inc/              bootstrap, db, schema.sql, seed, repo, constants, helpers, layout
assets/style.css  All styling (no framework, no build)
```
