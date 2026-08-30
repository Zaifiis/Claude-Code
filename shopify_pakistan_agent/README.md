# Shopify Pakistan Leads Agent

Finds Shopify stores in Pakistan, verifies each one live, and pulls whatever
contact info (email, WhatsApp number, phone) the store has published on its
own site. Built for prospecting an AI chatbot product (WhatsApp + website,
late-night chat coverage) — the CSV it produces is a lead list to review
and reach out to yourself, not an auto-outreach bot.

Same pattern as `../linkedin_agent`: a standalone Python script, `.env` for
config, `outputs/` for results, optional cron/Task Scheduler wiring.

## How it works

1. **Discover candidates.** If you set `SERPAPI_KEY` in `.env`, it runs a
   handful of search queries (`"Powered by Shopify" Pakistan`, `site:myshopify.com
   Pakistan`, per-niche variants) through SerpAPI — a paid search API, used
   instead of scraping Google's results page directly, which violates
   Google's ToS and gets you blocked fast. Without a key, it falls back to
   whatever domains you've added to `seed_domains.csv`.
2. **Verify, live, per domain.** For every candidate it fetches the actual
   homepage and checks for real Shopify signatures (`cdn.shopify.com`,
   `Shopify.theme`, etc.) before doing anything else. Nothing in the output
   is guessed — a domain only makes it into the CSV if the agent just
   confirmed it's a Shopify store.
3. **Scrape published contact info.** For confirmed stores it checks a few
   likely pages (home, `/pages/contact`, `/pages/contact-us`,
   `/policies/contact-information`, `/pages/about-us`) and pulls out an
   email, a WhatsApp number (`wa.me/...` links — a strong signal since
   you're selling WhatsApp chat), and a Pakistani phone number if present.
4. **Save a CSV** to `outputs/leads_<date>.csv`, and emails it to you if
   `GMAIL_USER`/`GMAIL_APP_PASSWORD`/`NOTIFY_EMAIL` are set in `.env`.
5. **Optionally draft an opener** (`--draft-messages`) using the local
   `claude` CLI (no API key needed, same trick as `linkedin_agent`) — one
   short, specific message per lead referencing the late-night chat gap.
   These are drafts to edit, not copy-paste-send.

## Setup

```bash
cd shopify_pakistan_agent
cp .env.example .env      # fill in SERPAPI_KEY and/or email settings
pip install -r requirements.txt
python agent.py --limit 5 # test small first
```

- `SERPAPI_KEY` — optional. Free tier at https://serpapi.com/manage-api-key.
  Without it, only `seed_domains.csv` is checked.
- `seed_domains.csv` — add domains you've found manually (Instagram/Facebook
  bios, your own Google searches). The agent verifies each one live, so it's
  fine to add guesses — unverified ones are simply dropped, never reported
  as leads.

Schedule it with `setup_cron.sh` (Linux/Mac) or `setup_task.bat` (Windows)
if you want a fresh list daily.

## Responsible use — read this before sending anything

This only reads information stores have published publicly on their own
sites (no login bypass, no paywalls, no private data). Even so:

- **Rate-limited and polite by default.** `REQUEST_DELAY_SECONDS` (2s) and
  `MAX_STORES_PER_RUN` (20) keep load on other people's servers low, and
  the scraper identifies itself via a real `User-Agent` and respects
  `robots.txt`. Don't crank these up to scrape aggressively.
- **This finds leads. It doesn't contact them.** Sending is a separate,
  manual step, on purpose:
  - **WhatsApp:** unsolicited outbound messages to numbers that haven't
    messaged you first, outside WhatsApp's approved template/opt-in flow,
    risk your WhatsApp Business number getting banned and violate Meta's
    Business Messaging Policy. Look into WhatsApp Business API templates
    before messaging anyone from this list.
  - **Email:** cold B2B email is broadly legal in most places (Pakistan's
    PECA included) but expects a real sender identity, an honest subject,
    and an easy opt-out — don't spoof anything, and stop mailing anyone who
    asks you to.
  - Keep initial volumes small and personalize — it's also just more
    effective than a mass blast.
- **Double-check before you write to someone.** The regex-based extraction
  will occasionally grab a stale or wrong email/number (a support alias
  that's no longer monitored, a partner's number in a footer, etc.). Skim
  the store's site yourself before reaching out.
