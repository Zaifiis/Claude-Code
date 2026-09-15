# Shopify AI sales agent

A chat widget for Shopify stores that knows the catalog, stays in sync with it,
and sells — answers questions, handles objections, upsells, and walks the
customer to checkout. Built for Pakistani stores first: Roman Urdu, Urdu script
and English, COD, PKR.

Complete and runnable: agent, catalog sync, backend, and the storefront widget.
What is left is wiring it to *your* accounts — see [SETUP.md](./SETUP.md) to
connect a store and [DEPLOY.md](./DEPLOY.md) to put it online.

---

## Try it right now

```bash
npm install
npm run chat
```

No Shopify account, no database, no API key needed. It runs against
`fixtures/store.ts` — a fake Pakistani clothing store with 20 products, real
variants, stock levels and policy pages.

```
You: koi garam hoodie hai 5000 se kam?

Sana: Ji, 320 GSM brushed fleece wali hoodies hain, proper warm.
Black PKR 4,200 mein S se XL tak, Maroon mein M aur XL.
Konsa colour pasand hai?
```

With no API key the replies come from the offline mock provider and are
**templated placeholders** — the routing, retrieval, tools and cart links are
real, the personality is not. Put `OPENAI_API_KEY=sk-...` (or
`ANTHROPIC_API_KEY=`) in a `.env` file in this folder to see the actual bot.

| Command | What it does |
|---|---|
| `npm run chat` | Talk to the bot in the terminal |
| `npm run serve` | Run the backend the widget talks to |
| `npm run sync` | Pull a real Shopify store into the mirror |
| `npm run eval` | Run the 44-case eval set, print a pass rate |
| `npm run smoke` | 87 checks — tools, sync mapping, signatures, memory |
| `npm run typecheck` | `tsc --noEmit` |

`npm run eval -- policy` runs only cases whose id contains "policy".
`npm run eval -- --verbose` prints every reply.

---

## How a turn works

```
customer message
   │
   ├─ 1. route      cheap model → intent, language, English search query, price cap
   │                 this is what makes Roman Urdu work: "koi lawn suit 3 hazar se kam"
   │                 becomes query="lawn suit" max_price=3000 before retrieval sees it
   │
   ├─ 2. retrieve   tools against the catalog — never the model's memory
   │
   └─ 3. reply      stronger model, streamed, with the persona + tool results
```

Split across `src/agent/`:

| File | Role |
|---|---|
| `pipeline.ts` | The turn loop. No HTTP, no Shopify, no Supabase — runs anywhere |
| `persona.ts` | The system prompt. This is the product |
| `tools.ts` | The seven tools, and the one rule: nothing is stated that a tool did not return |
| `guardrails.ts` | Post-hoc checks — banned phrases, length, script mixing, em dashes |
| `address.ts` | Strips bhai/baji unless the customer revealed their own gender |
| `language.ts` | Roman Urdu / Urdu / English detection, price-cap extraction |

Two catalog implementations sit behind one interface (`catalog/types.ts`), so
the agent cannot tell fixtures from a real store: `MemoryCatalog` for
development and evals, `SupabaseCatalog` for a synced store.

The pipeline has no HTTP, Shopify or database in it. That is why the same code
backs the terminal harness, the eval runner and the storefront endpoint — and
why WhatsApp later is a new entry point rather than a rewrite.

---

## The rules the bot will not break

Enforced in the prompt, checked by `guardrails.ts`, and asserted by the eval set:

- **Never states a price, stock level, delivery time or policy that did not come
  back from a tool this conversation.** No product is recalled from memory.
- **Mirrors the customer's language exactly** and never mixes two scripts in one
  message.
- **Never invents a discount.** `maxDiscountPercent` is 0 by default, and at 0
  the bot declines rather than negotiating.
- **Never claims to be a human.** It reads like a person, but asked directly it
  says it is the store's assistant and offers a human. Sounding human is the
  goal; lying about it is a different thing, and it is the kind of thing that
  gets an app pulled from the App Store.
- **Hands over** complaints, refund disputes and anything about an existing
  order, and never upsells on top of a complaint. But swearing and slang are
  not complaints — Pakistani customers are blunt, and handing a chatty customer
  a phone number loses the sale.
- **Never guesses gender.** bhai/baji only after the customer reveals it. This
  one is enforced in code, not just asked for in the prompt.

---

## Evals

`evals/cases.ts` holds 44 cases across language mirroring, retrieval,
truthfulness, policy questions, selling behaviour, escalation, rude customers
and prompt injection. Each says *why* it exists, and several were written from
real storefront conversations that went wrong.

Run it after **every** prompt change and compare the pass rate. Prompt edits
silently break things that used to work — this is the only way you find out.

44/44 against the **mock** provider measures plumbing, not persona quality.
Your real number comes from running it with an API key — that is the baseline
to improve against. Add a case every time a real conversation goes wrong.

---

## Cost

Every turn logs tokens and cost (`TurnResult.costUsd`, shown in the chat
harness and totalled by the eval runner). Watch it from day one: the business
question for this product is whether a conversation costs less than it earns
from a Pakistani merchant's monthly fee.

Measured on the fixture store: roughly **$0.002-0.003 per message**, so a
15-message conversation costs about **Rs 10**. The levers, in order, are prompt
caching on the persona block (it is identical every turn), the cheap router
model, and reply length.

---

## What's here

```
src/agent/        route -> retrieve -> reply, the persona, the tools
src/catalog/      one interface, two backings: fixtures and the real mirror
src/providers/    OpenAI, Anthropic, and an offline mock
src/shopify/      Admin GraphQL client, bulk operations
src/sync/         catalog sync with delete reconciliation
src/server/       app proxy chat endpoint (SSE), webhooks, signature checks
extensions/       the storefront widget, as a theme app extension
supabase/         schema.sql — the store mirror
evals/ scripts/   44 eval cases, 87 smoke checks, chat and sync CLIs
```

## Still to build

- **OAuth install flow** — needed only to sell to other merchants. One store
  works today with a custom app token.
- **Merchant dashboard** — sync status, the persona settings form, transcripts.
  `bot_settings` is read from the database already; nothing edits it yet.
- **Shopify Billing** — required before charging anyone.
- **WhatsApp** — the pipeline is transport-agnostic, so this is a new entry
  point rather than a rewrite.
