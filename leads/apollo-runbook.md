# Apollo run-book — exact filters for your ICP

## What happened when I tried the API

Apollo is connected, but **every endpoint that returns contact data is gated on
your Free plan.** I tested three, and spent zero credits doing so:

| Endpoint | Result |
|---|---|
| People Search (`mixed_people/api_search`) | `API_INACCESSIBLE` — not on Free plan |
| Bulk People Enrichment (`people/bulk_match`) | `API_INACCESSIBLE` — not on Free plan |
| People Enrichment (`people/match`) | `API_INACCESSIBLE` — not on Free plan |

Your credit balance is real — **167 lead credits**, cycle resets **19 Aug 2026**
— but credits and API access are separate things. The credits are spendable in
the Apollo **web app and Chrome extension**; they are not reachable through the
API on this plan.

Also worth knowing before you plan around it:

- **Waterfall enrichment is disabled** on your team (email and phone both).
  Standard reveal only.
- **Direct-dial credits are ambiguous.** The team endpoint reports 160/160
  consumed, 0 remaining; your user profile reports 16 of 160 used. They
  disagree. Check the balance in the web app before counting on phone reveals —
  do not assume you have 144 left.

So: **phone numbers are not reliably available, emails are.** Plan your outreach
on email and WhatsApp-from-published-numbers, not on Apollo mobiles.

## Run this yourself — 15 minutes, in the browser

Go to Apollo → **Search → People**, and set exactly these filters. This is the
ICP translated into Apollo's fields.

### Filter set A — Bali & Indonesia (your best market)

```
Job Titles          Founder, Co-Founder, Owner, Managing Director,
                    General Manager, CEO
Seniority           Owner, Founder, C-Suite
Company HQ          Indonesia
Employees           11–50  AND  51–200
Company Keywords    villa rental, vacation rental, property management,
                    holiday rental, short term rental
```

### Filter set B — UAE

```
Job Titles          Founder, Co-Founder, Owner, Managing Director, CEO
Seniority           Owner, Founder, C-Suite
Company HQ          United Arab Emirates
Employees           11–50  AND  51–200
Company Keywords    holiday homes, vacation rental, short term rental,
                    property management
```

### Filter set C — Thailand

```
Same as A, Company HQ = Thailand
Company Keywords    villa management, villa rental, property management
```

### Filter set D — US (higher ticket)

```
Job Titles          Founder, Owner, President, CEO, VP Marketing
Seniority           Owner, Founder, C-Suite, VP
Company HQ          United States
Employees           11–50  AND  51–200
Company Keywords    vacation rental management, short term rental,
                    cabin rental, property management
```

### Why 11–200 employees, specifically

That band is the whole ICP thesis expressed as a number.

- **Under 11** — a one-or-two-person operation with 3–5 properties. Buys one
  video, never a second. Not worth a credit.
- **11–50** — the core. 15–80 properties, the founder still signs off on
  marketing personally. **Spend most of your credits here.**
- **51–200** — 80–300 properties. Bigger orders, but you may meet a marketing
  manager rather than the owner. Worth including; expect a slower close.
- **Over 200** — Vacasa, Sonder, Awaze, Alloggio, TowneBank-owned operators.
  Procurement, vendor onboarding, legal. Your $150 offer dies in a form.
  **Exclude these — they are the main way to waste credits.**

## Spending 167 credits without wasting them

1. **Do not reveal on the search page.** Select first, reveal second.
2. Sort by company headcount and work the 11–50 band before the 51–200 band.
3. Reveal in batches of 25, then check what you got. If a batch comes back with
   mostly generic `info@` addresses, tighten the title filter before spending
   more — that pattern means Apollo has the company but not the person.
4. **Skip anyone whose company you can already reach.** You have 14 direct
   emails and 23 phone numbers in `leads-50.csv` already. Spending a credit to
   re-find `info@eliteluxhomes.ae` is pure waste.
5. Budget roughly: **100 credits Bali/Thailand/Dubai, 50 US, 17 spare.**

## Expect Apollo to underperform on Bali — this is not a mistake in your filters

Apollo's coverage is built on B2B firmographic data, which skews heavily to US
and European companies with LinkedIn-active staff. Small Indonesian and Thai
villa managers are largely absent from it. When you run Filter Set A you will
likely get far fewer results than Set D, and that is a fact about the database,
not about the market.

For Bali and Thailand, these beat Apollo outright and cost nothing:

1. **Instagram DM.** These founders run their own accounts. Highest answer rate
   of any channel available to you.
2. **The published WhatsApp number.** Message it; the owner's name appears on
   the business profile.
3. **The company About page.** Roughly a third name their team outright.

Use Apollo credits where Apollo is strong — **Dubai and the US** — and use
Instagram and WhatsApp where it is weak. Do not burn 167 credits trying to make
one tool cover all five markets.

## If you want the API to work

The API gate lifts on any paid plan. Only worth it if you are going to run this
at volume — at fifty leads, the browser flow does the same job for free, and
your credits are already sitting there unused.
