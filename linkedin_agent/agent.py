#!/usr/bin/env python3
"""
LinkedIn Series Agent
---------------------
Reads today's Claude Code conversations, generates a LinkedIn post outline
for the "Growing My Agency" (or auto-detected) day series, and emails it.

Run manually:  python agent.py          (or double-click run.bat on Windows)
Scheduled:     setup_task.bat          (Windows Task Scheduler at 4 PM)
               setup_cron.sh          (Linux/Mac cron at 4 PM)
"""

import json
import os
import glob
import smtplib
import subprocess
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

# ── Config ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

GMAIL_USER   = os.getenv("GMAIL_USER")         # your Gmail address
GMAIL_APP_PASS = os.getenv("GMAIL_APP_PASSWORD") # 16-char App Password
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL")        # where to send the outline

CLAUDE_PROJECTS_DIR = Path.home() / ".claude" / "projects"
TRACKER_FILE        = BASE_DIR / "series_tracker.json"
OUTPUTS_DIR         = BASE_DIR / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

TODAY = datetime.date.today()


# ── Day tracker ──────────────────────────────────────────────────────────────
def load_tracker() -> dict:
    with open(TRACKER_FILE) as f:
        return json.load(f)


def save_tracker(data: dict):
    with open(TRACKER_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_day_number(tracker: dict) -> int:
    """Return today's day number. Starts at 1 on first run."""
    today_str = TODAY.isoformat()
    if tracker["series_start_date"] is None:
        # First run — initialise
        tracker["series_start_date"] = today_str
        tracker["total_posts_sent"] = 0

    if tracker["last_post_date"] == today_str:
        # Already ran today — return same day number (idempotent)
        return tracker["total_posts_sent"]

    return tracker["total_posts_sent"] + 1


# ── Chat reader ──────────────────────────────────────────────────────────────
def read_today_conversations() -> str:
    """
    Scan all ~/.claude/projects/*/*.jsonl files, extract messages
    timestamped today, and return a single combined text blob.
    """
    today_str = TODAY.isoformat()
    messages = []

    pattern = str(CLAUDE_PROJECTS_DIR / "**" / "*.jsonl")
    jsonl_files = glob.glob(pattern, recursive=True)

    for filepath in jsonl_files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for raw_line in f:
                    raw_line = raw_line.strip()
                    if not raw_line:
                        continue
                    try:
                        entry = json.loads(raw_line)
                    except json.JSONDecodeError:
                        continue

                    # Filter to today only
                    ts = entry.get("timestamp", "")
                    if not ts.startswith(today_str):
                        continue

                    msg = entry.get("message", {})
                    role = msg.get("role", entry.get("type", ""))
                    content = msg.get("content", "")

                    # content can be a string or a list of blocks
                    if isinstance(content, list):
                        parts = []
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "text":
                                parts.append(block.get("text", ""))
                        content = " ".join(parts)

                    if content and isinstance(content, str) and len(content.strip()) > 10:
                        messages.append(f"[{role.upper()}]: {content.strip()}")

        except (IOError, PermissionError):
            continue

    if not messages:
        return ""

    return "\n\n".join(messages)


# ── Claude CLI call ───────────────────────────────────────────────────────────
def ask_claude(prompt: str) -> str:
    """Run the claude CLI and return its output. No API key needed."""
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI error: {result.stderr.strip()}")
    return result.stdout.strip()


def generate_linkedin_outline(chat_text: str, day_number: int, series_name: str) -> str:
    """Generate LinkedIn post outline from today's chat using claude CLI."""
    prompt = f"""You are a LinkedIn content strategist helping a founder build a personal brand around their AI agency journey. Write punchy, story-driven outlines that feel authentic — not corporate fluff.

Here are my Claude conversations from today:

---
{chat_text[:12000]}
---

Based on what I worked on today, create a LinkedIn post outline for:

Day {day_number} of {series_name}

Format the outline like this:

## Day {day_number} of {series_name}

**Hook** (1-2 lines that stop the scroll):
[your hook here]

**The Story** (3-5 bullet points — what happened today, what I built/learned/decided):
-
-
-

**The Insight** (1 key takeaway — make it memorable):
[insight here]

**Call to Action** (a question or invitation for comments):
[CTA here]

**Suggested Hashtags:**
[3-5 relevant hashtags]

**Tone Notes:**
[brief note on the right tone/angle for this post]

Keep it real. Use first-person. Avoid buzzwords. Make the hook genuinely interesting."""

    return ask_claude(prompt)


def generate_no_chat_outline(day_number: int, series_name: str) -> str:
    """Fallback outline when no chat data is found for today."""
    prompt = (
        f"Create a short LinkedIn post outline for Day {day_number} of {series_name}. "
        "No specific activity data is available today. Write a reflection-style post "
        "about consistency, showing up every day, and the agency-building journey. "
        "Use the same format: Hook, The Story (bullets), The Insight, CTA, Hashtags."
    )
    return ask_claude(prompt)


# ── Email sender ─────────────────────────────────────────────────────────────
def send_email(subject: str, body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = GMAIL_USER
    msg["To"]      = NOTIFY_EMAIL

    # Plain text version
    text_part = MIMEText(body, "plain")

    # HTML version (simple formatting)
    html_body = body.replace("\n", "<br>").replace("##", "<h2>").replace("**", "<strong>")
    html_part = MIMEText(f"<html><body><pre style='font-family:sans-serif'>{body}</pre></body></html>", "html")

    msg.attach(text_part)
    msg.attach(html_part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASS)
        server.sendmail(GMAIL_USER, NOTIFY_EMAIL, msg.as_string())

    print(f"[agent] Email sent to {NOTIFY_EMAIL}")


# ── Save output locally ───────────────────────────────────────────────────────
def save_output(outline: str, day_number: int):
    filename = OUTPUTS_DIR / f"day_{day_number:03d}_{TODAY.isoformat()}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# Day {day_number} LinkedIn Outline\n")
        f.write(f"_Generated: {TODAY.isoformat()} at 4 PM_\n\n")
        f.write(outline)
    print(f"[agent] Outline saved to {filename}")
    return filename


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print(f"[agent] Running LinkedIn outline agent — {TODAY.isoformat()}")

    # Validate config
    missing = [k for k, v in {
        "GMAIL_USER": GMAIL_USER,
        "GMAIL_APP_PASSWORD": GMAIL_APP_PASS,
        "NOTIFY_EMAIL": NOTIFY_EMAIL,
    }.items() if not v]

    if missing:
        print(f"[agent] ERROR: Missing environment variables: {', '.join(missing)}")
        print("[agent] Copy .env.example to .env and fill in your credentials.")
        return

    tracker     = load_tracker()
    day_number  = get_day_number(tracker)
    series_name = tracker.get("series_name", "Growing My Agency")

    print(f"[agent] Day {day_number} of {series_name}")

    # Read today's chats
    chat_text = read_today_conversations()
    if chat_text:
        print(f"[agent] Found {len(chat_text)} chars of chat data for today")
        outline = generate_linkedin_outline(chat_text, day_number, series_name)
    else:
        print("[agent] No chat data found for today — using reflection template")
        outline = generate_no_chat_outline(day_number, series_name)

    # Save locally
    save_output(outline, day_number)

    # Send email
    subject = f"[LinkedIn Series] Day {day_number} of {series_name} — {TODAY.strftime('%b %d')}"
    email_body = f"Day {day_number} of {series_name}\nGenerated on {TODAY.isoformat()}\n\n{outline}"
    send_email(subject, email_body)

    # Update tracker
    tracker["total_posts_sent"] = day_number
    tracker["last_post_date"]   = TODAY.isoformat()
    save_tracker(tracker)

    print(f"[agent] Done! Day {day_number} outline sent and saved.")


if __name__ == "__main__":
    main()
