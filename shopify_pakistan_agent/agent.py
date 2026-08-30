#!/usr/bin/env python3
"""
Shopify Pakistan Leads Agent
----------------------------
Finds Shopify stores based in / selling to Pakistan, verifies each one is
actually running Shopify (live check, not a guess), and pulls whatever
contact info the store has published on its own site (email, WhatsApp
number, phone) — for outreach about an AI chatbot (WhatsApp + website,
late-night coverage).

It does NOT send any messages. It only builds a lead list. Sending is a
manual, deliberate step you take afterwards — see README.md for why.

Run manually:  python agent.py             (or double-click run.bat on Windows)
Scheduled:     setup_task.bat              (Windows Task Scheduler)
               setup_cron.sh               (Linux/Mac cron)
"""

import argparse
import csv
import datetime
import os
import re
import smtplib
import subprocess
import time
import urllib.robotparser
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

try:
    from ddgs import DDGS  # free, no API key — pip install ddgs
except ImportError:
    DDGS = None

# ── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

SERPAPI_KEY = os.getenv("SERPAPI_KEY")  # optional — see README for a free key
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASS = os.getenv("GMAIL_APP_PASSWORD")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL")

MAX_STORES_PER_RUN = int(os.getenv("MAX_STORES_PER_RUN", "20"))
REQUEST_DELAY_SECONDS = float(os.getenv("REQUEST_DELAY_SECONDS", "2"))
USER_AGENT = os.getenv(
    "SCRAPER_USER_AGENT",
    "ShopifyPakistanLeadsBot/1.0 (+lead research; contact: " + (GMAIL_USER or "unset") + ")",
)

SEED_FILE = BASE_DIR / "seed_domains.csv"
OUTPUTS_DIR = BASE_DIR / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

TODAY = datetime.date.today()

# ICP = small/local Pakistani Shopify stores, not national retail chains.
# A chain like Khaadi or Outfitters already has a call center and a support
# budget line item; a one-person boutique running orders through WhatsApp
# DMs is exactly who feels the "nobody's answering at 11pm" pain and can
# actually decide to buy on a cold DM. So queries below lean on
# small-business / home-based / boutique / WhatsApp-ordering language
# instead of "top" or "best" (which mostly surfaces the big chains).
SEARCH_QUERIES = [
    '"order on whatsapp" Pakistan shopify online store',
    "Pakistan home based business online store shopify",
    "Pakistan small business boutique shopify online store",
    "Pakistan handmade jewelry shopify online store",
    "Pakistan candles soap skincare small business shopify store",
    "Pakistan thrift resell shopify online store",
    "Pakistan bakery home bakers shopify online store",
    "Pakistan abaya hijab modest wear small brand shopify store",
    "site:myshopify.com Pakistan",
    "Karachi Lahore Islamabad small business online store shopify",
]

DOMAIN_BLOCKLIST = {
    "facebook.com", "instagram.com", "youtube.com", "twitter.com", "x.com",
    "linkedin.com", "pinterest.com", "tiktok.com", "wikipedia.org",
    "shopify.com", "apps.shopify.com", "help.shopify.com", "themes.shopify.com",
    "google.com", "amazon.com", "reddit.com", "quora.com", "trustpilot.com",
}

# Large national/enterprise retail chains — usually have their own support
# team already (poor ICP fit for a cheap AI WhatsApp agent), and several of
# them (Khaadi, Sapphire) aren't even on Shopify despite what "top Shopify
# stores in Pakistan" listicles claim. Skipped outright so a run doesn't
# burn requests/output slots on them. Remove any of these if you disagree
# with the call for your product.
ENTERPRISE_BLOCKLIST = {
    "khaadi.com", "sapphireonline.pk", "outfitters.com.pk", "limelight.pk",
    "gulahmedshop.com", "junaidjamshed.com", "alkaramstudio.com",
    "nishatlinen.com", "breakout.com.pk", "bonanzasatrangi.com",
    "chenone.com", "generation.com.pk", "khaddi.pk",
}

EMAIL_NOISE_DOMAINS = {
    "sentry.io", "wixpress.com", "example.com", "schema.org", "w3.org",
    "godaddy.com", "shopify.com", "cloudflare.com",
}

CONTACT_PATHS = ["", "/pages/contact", "/pages/contact-us", "/policies/contact-information", "/pages/about-us"]

EMAIL_RE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
WA_RE = re.compile(r"(?:wa\.me/|api\.whatsapp\.com/send\?phone=)(\d{7,15})")
PK_PHONE_RE = re.compile(r"(?:\+92|0092)[\s\-]?3\d{2}[\s\-]?\d{7}|03\d{2}[\s\-]?\d{7}")
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SHOPIFY_SIGNATURES = ["cdn.shopify.com", "shopify.theme", "myshopify.com", "shopifycloud", "cdn/shop/"]


# ── Discovery ────────────────────────────────────────────────────────────────
def search_candidates() -> list[str]:
    """Return candidate root domains from a live web search plus anything in
    seed_domains.csv. Nothing here is asserted as a real Shopify store yet —
    that's verified per-domain in verify_and_scrape().

    Uses SerpAPI if you've set SERPAPI_KEY (paid, but often more reliable at
    volume). Otherwise falls back to ddgs — free, no API key, no signup."""
    domains = set()

    if SERPAPI_KEY:
        for query in SEARCH_QUERIES:
            try:
                resp = requests.get(
                    "https://serpapi.com/search.json",
                    params={"engine": "google", "q": query, "gl": "pk", "num": 20, "api_key": SERPAPI_KEY},
                    timeout=15,
                )
                resp.raise_for_status()
                for result in resp.json().get("organic_results", []):
                    link = result.get("link")
                    if link:
                        domains.add(root_domain(link))
            except requests.RequestException as e:
                print(f"[agent] SerpAPI query failed ({query!r}): {e}")
    elif DDGS is not None:
        for query in SEARCH_QUERIES:
            try:
                for result in DDGS().text(query, max_results=20, region="pk-en"):
                    link = result.get("href")
                    if link:
                        domains.add(root_domain(link))
            except Exception as e:
                print(f"[agent] ddgs query failed ({query!r}): {e}")
            time.sleep(REQUEST_DELAY_SECONDS)
    else:
        print("[agent] No search method available — install ddgs (pip install ddgs) or set "
              "SERPAPI_KEY. Falling back to seed_domains.csv only.")

    if SEED_FILE.exists():
        with open(SEED_FILE, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                d = (row.get("domain") or "").strip()
                if d and not d.startswith("#"):
                    domains.add(root_domain(d))

    domains -= DOMAIN_BLOCKLIST
    domains -= ENTERPRISE_BLOCKLIST
    return sorted(domains)


def root_domain(url_or_domain: str) -> str:
    if "://" not in url_or_domain:
        url_or_domain = "https://" + url_or_domain
    return urlparse(url_or_domain).netloc.lower().removeprefix("www.")


# ── Per-store verification + scraping ───────────────────────────────────────
def allowed_by_robots(domain: str) -> bool:
    try:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(f"https://{domain}/robots.txt")
        rp.read()
        return rp.can_fetch(USER_AGENT, f"https://{domain}/")
    except Exception:
        return True  # no robots.txt or unreachable — default to allow


def fetch(url: str) -> str | None:
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=10)
        if resp.status_code == 200:
            return resp.text
    except requests.RequestException:
        pass
    return None


def is_shopify(html: str) -> bool:
    lowered = html.lower()
    return any(sig in lowered for sig in SHOPIFY_SIGNATURES)


def extract_store_name(html: str, domain: str) -> str:
    match = TITLE_RE.search(html)
    if match:
        title = re.sub(r"\s+", " ", match.group(1)).strip()
        return title[:80] if title else domain
    return domain


def extract_contacts(html: str, domain: str) -> dict:
    emails = {
        e for e in EMAIL_RE.findall(html)
        if e.split("@")[-1].lower() not in EMAIL_NOISE_DOMAINS
        and not e.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"))
    }
    # Prefer an address that actually matches the store's own domain or a
    # generic role account — those are far more likely to be real/monitored.
    preferred = [e for e in emails if domain in e.lower() or e.lower().split("@")[0] in
                 {"info", "support", "contact", "sales", "hello", "help", "care", "orders"}]

    whatsapp_numbers = set(WA_RE.findall(html))
    other_phones = set(PK_PHONE_RE.findall(html))

    return {
        "email": sorted(preferred or emails)[0] if (preferred or emails) else "",
        "whatsapp": sorted(whatsapp_numbers)[0] if whatsapp_numbers else "",
        "phone": sorted(other_phones)[0] if other_phones else "",
        "has_whatsapp_widget": bool(whatsapp_numbers),
    }


def verify_and_scrape(domain: str) -> dict | None:
    if not allowed_by_robots(domain):
        print(f"[agent]   {domain}: skipped (robots.txt disallows)")
        return None

    homepage = fetch(f"https://{domain}/")
    if homepage is None:
        return None
    if not is_shopify(homepage):
        return None

    combined_html = homepage
    for path in CONTACT_PATHS[1:]:
        time.sleep(REQUEST_DELAY_SECONDS)
        page = fetch(f"https://{domain}{path}")
        if page:
            combined_html += page

    contacts = extract_contacts(combined_html, domain)
    return {
        "store_name": extract_store_name(homepage, domain),
        "domain": domain,
        "email": contacts["email"],
        "whatsapp": contacts["whatsapp"],
        "phone": contacts["phone"],
        "has_whatsapp_widget": contacts["has_whatsapp_widget"],
        "checked_at": datetime.datetime.now().isoformat(timespec="seconds"),
    }


# ── Optional: draft an outreach opener via the local claude CLI ─────────────
def ask_claude(prompt: str) -> str:
    result = subprocess.run(["claude", "-p", prompt], capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI error: {result.stderr.strip()}")
    return result.stdout.strip()


def draft_outreach_message(lead: dict) -> str:
    prompt = (
        f"Write a short (under 60 words), friendly opening message to the owner of "
        f"\"{lead['store_name']}\" ({lead['domain']}), a Shopify store in Pakistan. "
        "I sell an AI chatbot that handles WhatsApp and website chat for online stores "
        "overnight, so customers browsing late at night get instant answers instead of "
        "waiting until morning. No hard sell — just a genuine, specific opener referencing "
        "that late-night gap. Plain text, no hashtags, no emojis."
    )
    try:
        return ask_claude(prompt)
    except Exception as e:
        print(f"[agent]   draft failed for {lead['domain']}: {e}")
        return ""


# ── Output ───────────────────────────────────────────────────────────────────
CSV_FIELDS = ["store_name", "domain", "email", "whatsapp", "phone", "has_whatsapp_widget", "draft_message", "checked_at"]


def save_csv(leads: list[dict]) -> Path:
    # Best ICP signal first: a store already running orders through
    # WhatsApp is the clearest sign it'll get the pitch immediately.
    leads = sorted(leads, key=lambda lead: not lead.get("has_whatsapp_widget"))

    filename = OUTPUTS_DIR / f"leads_{TODAY.isoformat()}.csv"
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for lead in leads:
            writer.writerow({k: lead.get(k, "") for k in CSV_FIELDS})
    print(f"[agent] Saved {len(leads)} leads to {filename}")
    return filename


def email_results(csv_path: Path, lead_count: int):
    if not (GMAIL_USER and GMAIL_APP_PASS and NOTIFY_EMAIL):
        return
    msg = MIMEMultipart()
    msg["Subject"] = f"[Shopify PK Leads] {lead_count} stores found — {TODAY.isoformat()}"
    msg["From"] = GMAIL_USER
    msg["To"] = NOTIFY_EMAIL
    msg.attach(MIMEText(f"{lead_count} verified Shopify stores found in this run. CSV attached.\n"))

    with open(csv_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f'attachment; filename="{csv_path.name}"')
    msg.attach(part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASS)
        server.sendmail(GMAIL_USER, NOTIFY_EMAIL, msg.as_string())
    print(f"[agent] Emailed results to {NOTIFY_EMAIL}")


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=MAX_STORES_PER_RUN, help="max domains to check this run")
    parser.add_argument("--draft-messages", action="store_true", help="draft an outreach opener per lead via the local claude CLI")
    args = parser.parse_args()

    print(f"[agent] Running Shopify Pakistan leads agent — {TODAY.isoformat()}")

    candidates = search_candidates()[: args.limit]
    if not candidates:
        print("[agent] No candidate domains found. Add a SERPAPI_KEY to .env or populate seed_domains.csv.")
        return

    print(f"[agent] Checking {len(candidates)} candidate domain(s)...")

    leads = []
    for i, domain in enumerate(candidates, 1):
        print(f"[agent] [{i}/{len(candidates)}] {domain}")
        lead = verify_and_scrape(domain)
        if lead:
            print(f"[agent]   -> confirmed Shopify store. email={lead['email'] or '-'} whatsapp={lead['whatsapp'] or '-'}")
            if args.draft_messages and (lead["email"] or lead["whatsapp"]):
                lead["draft_message"] = draft_outreach_message(lead)
            leads.append(lead)
        time.sleep(REQUEST_DELAY_SECONDS)

    if not leads:
        print("[agent] No confirmed Shopify stores this run.")
        return

    csv_path = save_csv(leads)
    email_results(csv_path, len(leads))
    print(f"[agent] Done! {len(leads)} verified lead(s). Review the CSV before contacting anyone — "
          f"drafts are starting points, not approved copy.")


if __name__ == "__main__":
    main()
