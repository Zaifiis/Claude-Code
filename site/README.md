# Kairo — agency site + lead desk

A complete, self-contained marketing site with a working lead pipeline, built
for **Hostinger shared hosting**: PHP 8 + MySQL, no build step, no Node, no
Composer. Upload the folder, fill in one config file, done.

It is the front door the rest of this repo was missing. The n8n workflow and the
dashboard handle content *after* someone knows who you are — this is what turns
a LinkedIn reader into an enquiry sitting in a database you own.

---

## What you get

**Public site** — home, services, work, pricing, about, contact, free-audit
funnel, thank-you, privacy, terms, 404.

| Feature | Detail |
| --- | --- |
| Lead capture | Contact form + a 3-step "automation audit" wizard |
| Lead scoring | Every enquiry scored 0–100 on budget, timeline and team size |
| ROI calculator | Live savings estimate from the visitor's own numbers |
| Newsletter | Footer sign-up with one-click unsubscribe |
| Email | Notification to you + auto-reply to them, over SMTP |
| SEO | Canonical tags, Open Graph, generated `sitemap.xml`, JSON-LD |
| Social card | `og.png`, regenerated from your brand with one command |

**Lead desk** at `/admin` — a private dashboard listing every enquiry, with
search, status filters, fit-score sorting, working notes and CSV export.

**Security** — strict Content-Security-Policy, CSRF tokens, honeypot and
timing bot traps, per-IP rate limiting, prepared statements everywhere, hashed
passwords, hashed IPs, and a CSV export that neutralises spreadsheet formula
injection.

Works with JavaScript disabled. Every form is handled server-side; JavaScript
only makes the wizard nicer.

---

## Deploy to Hostinger

### 1. Upload

**hPanel → Files → File Manager**, or FTP.

Put the **contents of `public_html/`** into your account's `public_html`, and
put `.env` **one level above it** — outside the web root, where a browser can
never reach it:

```
/home/uXXXXXXX/
├── .env                 ← your config (step 3), NOT public
├── storage/             ← created automatically for logs
└── public_html/         ← everything from site/public_html/
    ├── index.php
    ├── .htaccess        ← make sure hidden files are shown when you upload
    ├── admin/
    ├── api/
    ├── assets/
    └── inc/
```

> The File Manager hides dotfiles by default. Turn on **Settings → Show hidden
> files** or `.htaccess` will not make it up, and you will lose clean URLs and
> the HTTPS redirect.

### 2. Create the database

**hPanel → Databases → MySQL Databases.** Create a database and a user, and
copy the generated name, user and password — Hostinger prefixes them, so they
will not be what you typed.

Open **phpMyAdmin → Import** and upload `db/schema.sql`.

### 3. Configure

Copy `.env.example` to `.env` and fill it in. Generate the app key first:

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

No shell? Hostinger has one at **Advanced → SSH Access**, or paste that line
into any PHP file, load it once, and delete the file.

The values that matter:

```ini
APP_URL=https://yourdomain.com      # no trailing slash
APP_KEY=<the 64 characters you just generated>

BRAND_NAME=Your Agency
BRAND_TAGLINE=What you do, in one line
BRAND_EMAIL=hello@yourdomain.com
BRAND_CALENDAR_URL=https://cal.com/you    # optional, adds "book a time" buttons

DB_NAME=uXXXXXXX_kairo
DB_USER=uXXXXXXX_kairo
DB_PASS=<the password you set>

MAIL_TRANSPORT=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
MAIL_USER=hello@yourdomain.com      # a real mailbox, created in step 5
MAIL_PASS=<that mailbox's password>
MAIL_FROM=hello@yourdomain.com
MAIL_TO=you@wherever.com            # where new-lead alerts land
```

### 4. Create your admin login

Generate a hash of the password you want:

```bash
php -r "echo password_hash('a-long-password-you-will-remember', PASSWORD_DEFAULT), PHP_EOL;"
```

Paste it into the commented-out `INSERT` at the bottom of `db/schema.sql`, and
run that one statement in phpMyAdmin. Sign in at `https://yourdomain.com/admin/`.

With SSH access you can skip the copy-paste:

```bash
php tools/install-db.php --admin="Your Name" --email=you@yourdomain.com
```

### 5. Email

**hPanel → Emails → Email Accounts** — create the mailbox you put in
`MAIL_USER`. Sending through your own domain's SMTP is what keeps
notifications out of spam; `MAIL_TRANSPORT=mail` works as a fallback but
delivers badly.

Test it by submitting your own contact form. Two emails should arrive: the
alert to `MAIL_TO` and the auto-reply to whatever address you used. If neither
shows up, set `MAIL_TRANSPORT=log` temporarily and read `storage/mail.log` to
confirm the site is generating them, then fix the SMTP settings.

### 6. SSL

**hPanel → Security → SSL** and install the free certificate. Wait until it is
live before visiting the site, because `.htaccess` forces HTTPS — if you need
to look at it first, comment out the *Force HTTPS* block.

### 7. Point the domain

**hPanel → Domains**. If your DNS is elsewhere, point the nameservers at
Hostinger and give it a few hours.

### 8. Launch checklist

- [ ] `APP_KEY` set, `APP_URL` matches the real domain
- [ ] Brand name, tagline and email set in `.env`
- [ ] Prices and services edited in `public_html/inc/content.php`
- [ ] Company name and address filled into `privacy.php` and `terms.php` —
      search for `[Your registered company name`
- [ ] Real domain written into `robots.txt`
- [ ] A test enquiry arrives by email *and* appears in `/admin`
- [ ] `https://yourdomain.com/sitemap.xml` loads, then submit it to
      [Google Search Console](https://search.google.com/search-console)
- [ ] `https://yourdomain.com/inc/config.php` returns **403** (if it returns
      PHP source, `.htaccess` did not upload)

---

## Making it yours

**All the copy lives in one file:** `public_html/inc/content.php`. Services,
process, pricing, FAQ, build notes and the audit questions are plain PHP
arrays. Change a string, reload the page. It is marked with three
`▸ EDIT ME` blocks for the things you must set before launch.

**Testimonials are empty on purpose.** The section does not render until you
put something real in `testimonials()`. Invented quotes on a site that sells
trust are not worth the risk.

**Build notes describe systems, not fake client metrics,** for the same reason.
Replace them with your own work — and real numbers — as you ship it.

**Colours and type** live in the tokens at the top of
`public_html/assets/css/site.css`. Change `--accent` and the whole site moves
with it.

**The social card** regenerates from your brand:

```bash
php tools/make-og.php
```

---

## Running it locally

```bash
cp .env.example .env
# set: APP_KEY, DB_DRIVER=sqlite, DB_NAME=/absolute/path/to/dev.sqlite,
#      MAIL_TRANSPORT=log, APP_URL=http://127.0.0.1:8000

php tools/install-db.php --admin="Me" --email=me@example.com
php -S 127.0.0.1:8000 -t public_html tools/serve.php
```

SQLite is a convenience for previewing — production uses MySQL. Keep `APP_URL`
exactly matching the host you browse, or redirects will point somewhere your
browser cannot reach.

---

## How it fits together

```
Visitor
   │  fills the contact form or the audit wizard
   ▼
contact.php / audit.php ──► inc/leads.php
   │                            │  1. write the row   (source of truth)
   │                            │  2. email you       (best effort)
   │                            └─ 3. email them      (best effort)
   ▼
/thanks?ref=KA-260922-7F3QX        MySQL `leads`
                                        │
                                        ▼
                              /admin — search, score, status, notes, CSV
```

The database is written **before** any email is attempted, so an SMTP outage
delays your notification but never loses an enquiry. Everything waiting for you
is in `/admin` regardless.

### Layout

```
site/
├── .env.example            config template
├── db/
│   ├── schema.sql          MySQL — the one you import on Hostinger
│   └── schema.sqlite.sql   local preview only
├── tools/
│   ├── install-db.php      creates tables + your admin user
│   ├── make-og.php         regenerates the social card
│   └── serve.php           router for PHP's built-in server
└── public_html/
    ├── *.php               the pages
    ├── .htaccess           clean URLs, HTTPS, caching, lockdown
    ├── sitemap.php         served as /sitemap.xml
    ├── admin/              the lead desk
    ├── api/subscribe.php   newsletter endpoint
    ├── assets/             css, js, images
    └── inc/
        ├── content.php     ← all site copy
        ├── leads.php       save, score, notify
        ├── security.php    CSP, CSRF, rate limits, bot traps
        ├── mailer.php      SMTP client (no Composer)
        ├── db.php          PDO wrapper
        └── partials/       head, header, footer
```

---

## Security notes

- **Content-Security-Policy** allows nothing but `'self'`. No inline scripts,
  no third-party origins. The one inline block (JSON-LD) is allow-listed by
  SHA-256 hash rather than opening the policy up. Add an external script and it
  will be blocked until you widen the policy in `inc/security.php` — that is
  the intended friction.
- **No cookies on public pages.** CSRF tokens on logged-out forms are signed
  with `APP_KEY` instead of stored in a session, so the marketing pages stay
  cacheable and there is nothing to put a cookie banner on. Admin uses real
  sessions with idle and absolute timeouts.
- **IP addresses are never stored** — only an HMAC of them, which is enough to
  rate-limit and enough to stay out of "we hold your IP" territory.
- **Rotating `APP_KEY`** invalidates every in-flight form token (visitors get
  "that form expired" once) and orphans existing rate-limit rows. Both are
  harmless; rotate freely if the key leaks.
- `.env` lives outside `public_html`. If your host forces it inside, the
  `.htaccess` rules deny `.env` directly — but move it out if you can.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "Setup incomplete" page | `.env` missing or `APP_KEY` empty. It must sit one level above `public_html`. |
| Every URL 404s except `/` | `.htaccess` did not upload. Enable hidden files in File Manager. |
| PHP source in the browser | Same cause. Fix it immediately — it exposes your config. |
| Redirect loop | HTTPS forced before the certificate was issued. Comment out the *Force HTTPS* block until SSL is live. |
| Forms say "That form expired" | `APP_KEY` changed, or the page sat open for over two hours. Reload. |
| "Cannot reach the database" in admin | `DB_*` wrong. Hostinger prefixes the name and user with your account id. |
| No emails, but leads appear in `/admin` | SMTP. Working as designed — the row is saved first. Check `storage/php-error.log`. |
| Admin signs you out quickly | Two hours idle or twelve since login. Tune the constants in `admin/auth.php`. |
