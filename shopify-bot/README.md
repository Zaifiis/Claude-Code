# Shopify AI sales agent

A chat widget for Shopify stores that knows the catalog, stays in sync with it,
and sells — answers questions, handles objections, upsells, and walks the
customer to checkout. Built for Pakistani stores first: Roman Urdu, Urdu script
and English, COD, PKR.

**This folder currently holds the brain, not the storefront app.** You can talk
to the bot today; connecting a real Shopify store is the next milestone. See
[SETUP.md](./SETUP.md).

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

Sana: Ye do cheezein mil sakti hain:
Fleece Hoodie — Black — PKR 4,200
Fleece Hoodie — Maroon — PKR 4,200
Konsi pasand aayi?
```

Without `ANTHROPIC_API_KEY` the replies come from the offline mock provider and
are **templated placeholders** — the routing, retrieval, tools and cart links
are real, the personality is not. Set a key to see the actual bot.

| Command | What it does |
|---|---|
| `npm run chat` | Talk to the bot in the terminal |
| `npm run eval` | Run the 40-case eval set, print a pass rate |
| `npm run smoke` | Tool-layer checks — no model involved |
| `npm run typecheck` | `tsc --noEmit` |

`npm run eval -- policy` runs only cases whose id contains "policy".
`npm run eval -- --verbose` prints every reply.

---

## How a turn works

```
customer message
   │
   ├─ 1. route      cheap model (Haiku)  → intent, language, English search query, price cap
   │                 this is what makes Roman Urdu work: "koi lawn suit 3 hazar se kam"
   │                 becomes query="lawn suit" max_price=3000 before retrieval sees it
   │
   ├─ 2. retrieve   tools against the catalog — never the model's memory
   │
   └─ 3. reply      strong model (Opus) with the persona + tool results
```

Split across `src/agent/`:

| File | Role |
|---|---|
| `pipeline.ts` | The turn loop. No HTTP, no Shopify, no Supabase — runs anywhere |
| `persona.ts` | The system prompt. This is the product |
| `tools.ts` | The seven tools, and the one rule: nothing is stated that a tool did not return |
| `guardrails.ts` | Post-hoc checks — banned phrases, length, script mixing |
| `language.ts` | Roman Urdu / Urdu / English detection, price-cap extraction |

Two catalog implementations sit behind one interface (`catalog/types.ts`), so
the agent cannot tell fixtures from a real store: `MemoryCatalog` today,
`SupabaseCatalog` next.

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
  order, and never upsells on top of a complaint.

---

## Evals

`evals/cases.ts` holds 40 cases across language mirroring, retrieval,
truthfulness, policy questions, selling behaviour, escalation, rude customers
and prompt injection. Each says *why* it exists.

Run it after **every** prompt change and compare the pass rate. Prompt edits
silently break things that used to work — this is the only way you find out.

The current 40/40 is against the **mock** provider, which measures plumbing, not
persona quality. Your first real number comes when you add an API key; that is
the baseline to hill-climb from. Add a case every time a real conversation goes
wrong.

---

## Cost

Every turn logs tokens and cost (`TurnResult.costUsd`, shown in the chat
harness and totalled by the eval runner). Watch it from day one: the business
question for this product is whether a conversation costs less than it earns
from a Pakistani merchant's monthly fee. The levers, in order, are prompt
caching on the persona block, the cheap router, and reply effort.

---

## Next

1. `shopify app init --template reactRouter` — needs your Partner login
2. `SupabaseCatalog` behind the existing `CatalogRepository` interface
3. Sync: bulk operation on install, webhooks for changes, daily reconcile
4. The widget: theme app extension + app embed block, over Shopify's App Proxy

Full plan and rationale in [SETUP.md](./SETUP.md).
