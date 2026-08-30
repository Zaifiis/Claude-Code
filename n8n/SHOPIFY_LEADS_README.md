# Shopify Pakistan Leads (n8n workflow)

n8n version of `../shopify_pakistan_agent/agent.py` — same logic (verify
Shopify live, scrape published contact info), plus a tech-stack read
(theme, Shopify Plus vs standard, installed apps, analytics tags, CDN)
since n8n makes it easy to fan that out per domain. Same rules as the
Python agent: identifies itself honestly, respects `robots.txt`, rate
limits (2s between domains), and only reads what a store has already
published on its own public pages. No stealth/anti-detection tooling —
if a store's `robots.txt` or firewall blocks it, the workflow skips that
domain and moves on rather than trying to get around the block.

## What it does

1. **Read Domains Sheet** — reads a `domain` column from a "Domains" tab
   in a Google Sheet (this is where you paste in domains — from
   `shopify_pakistan_agent/seed_domains.csv`, a directory export, wherever).
2. **Filter Blocklist** — drops national chains (same `ENTERPRISE_BLOCKLIST`
   as the Python agent), normalizes URLs to bare domains, dedupes.
3. **Loop Domains** (one at a time):
   - **Fetch robots.txt** → **Check Robots Allowed** → skip if disallowed.
   - **Fetch Homepage** → **Check Shopify Signature** → skip if it's not
     actually running Shopify (checks for `cdn.shopify.com`,
     `Shopify.theme`, response headers, etc. — nothing is assumed).
   - **Fetch Contact Page** (`/pages/contact-us`) — merged with the
     homepage HTML for extraction.
   - **Extract Leads + Tech Stack** — pulls email, WhatsApp number
     (`wa.me/...`), Pakistani phone number, theme name, Shopify Plus
     signal, installed apps (Klaviyo, Judge.me, Loox, Gorgias, Tidio,
     Chaty, Shopify Inbox, etc.), analytics tags (GA4, GTM, Meta Pixel,
     TikTok Pixel, Pinterest, Snapchat), and CDN/proxy (Shopify's own CDN,
     optionally fronted by Cloudflare).
   - **Append Lead** — writes the row to a "Leads" tab, keyed on `domain`
     so re-runs update rather than duplicate.
   - **Wait 2s** before the next domain.
4. **Run Complete** — fires once after the last domain.

## Setup

1. Create a Google Sheet with two tabs:
   - **Domains** — one column, header `domain`, one domain per row.
   - **Leads** — header row matching the columns in "Append Lead":
     `store_name, domain, email, whatsapp, phone, has_whatsapp_widget,
     is_shopify_plus, theme_name, installed_apps, analytics_tags,
     cdn_provider, checked_at`
2. In n8n: **Workflows → Import from File** → select
   `shopify_pakistan_leads_workflow.json`.
3. Open **Read Domains Sheet** and **Append Lead**, set your Google Sheets
   credential, and point `documentId`/`sheetName` at your sheet (their
   IDs are placeholders on purpose).
4. Open the three **HTTP Request** nodes and replace
   `REPLACE_WITH_YOUR_EMAIL` in the `User-Agent` header with a real
   contact — this is what lets a site owner see who's requesting their
   page and reach out if they want it stopped.
5. Run it manually first with a handful of domains in the sheet to make
   sure everything's wired up before pointing it at all 100+.

**Note on node versions:** IF-node condition syntax and Google Sheets
operation names have shifted across n8n releases. If either node shows a
warning on import, open it once — the intent (boolean check for
`allowed`/`isShopify`; append-or-update matched on `domain`) will be
obvious even if a dropdown needs reselecting for your version.

## Same responsible-use notes as the Python agent apply here

See `../shopify_pakistan_agent/README.md`'s "Responsible use" section —
it's not repeated in full here, but nothing about running this in n8n
instead of Python changes it: this finds leads, it doesn't contact them;
double-check a scraped email/number before reaching out; WhatsApp cold
outreach outside Meta's opt-in flow risks your number getting banned.
