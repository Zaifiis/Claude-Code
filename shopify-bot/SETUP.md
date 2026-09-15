# Setup — from zero

You do not need any of this to run the bot locally. `npm install && npm run chat`
works right now against the fixture store. This document is for when you want to
connect a **real Shopify store**.

Everything in Phase 0 is free.

---

## Phase 0 — accounts (about an hour)

### 1. Shopify Partner account

Sign up at <https://partners.shopify.com>. Free, no card. This is the developer
account — it is not a store and you are not paying Shopify anything.

### 2. Development store

Partner dashboard → **Stores** → **Add store** → **Create development store**.

Free, never expires, and it behaves like a real store except it cannot take real
payments. Then populate it, because an empty store teaches you nothing:

- **~20 products** with real-looking PKR prices and real variants (sizes,
  colours). Set stock levels, and deliberately set a few variants to 0.
- **Write two or three descriptions badly on purpose.** Real merchant catalogs
  are full of products described as "Silk scarf." — the bot has to cope with
  that, and you want to find out now rather than on a client's store.
- **Policy pages** — Settings → Policies. Write the shipping policy, the return
  policy, and say explicitly whether COD is available and what delivery costs.
  In Pakistan "COD hai?" and "delivery kitne din?" are the two most asked
  questions in any store chat. If those pages are empty, the bot has nothing
  truthful to say.

`fixtures/store.ts` in this repo is a worked example of all of the above — copy
its products and policies into your dev store if you want a shortcut.

### 3. Create the app

Partner dashboard → **Apps** → **Create app** → **Create app manually**.

Note down:
- **Client ID** → `SHOPIFY_API_KEY`
- **Client secret** → `SHOPIFY_API_SECRET`

### 4. Supabase project

<https://supabase.com> → new project. Free tier is plenty to start.

1. **SQL Editor** → paste `supabase/schema.sql` from this folder → Run.
   It enables the `vector` extension itself.
2. **Settings → API** → copy the project URL and the `service_role` key.

> Read the dimension note at the top of `schema.sql` before you insert anything.
> pgvector cannot change a column's dimension once the table has rows.

### 5. Model API key

Get an Anthropic API key from <https://console.anthropic.com>. Without one the
bot falls back to the offline mock and its replies are templated placeholders.

### 6. Shopify CLI

```bash
npm install -g @shopify/cli@latest
shopify version
```

---

## Environment

Create `.env` in this folder:

```bash
# Shopify (from step 3)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=            # the tunnel URL `shopify app dev` prints
SCOPES=read_products,read_inventory,read_content,read_locales

# Supabase (from step 4)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Model (from step 5)
ANTHROPIC_API_KEY=

# Force the offline mock even when a key is present. Use this in CI.
# BOT_PROVIDER=mock
```

`.env` is gitignored. Never commit it — the service role key bypasses every RLS
policy in the database, and the Shopify secret lets anyone impersonate your app.

---

## What is not built yet

This folder currently contains the **brain and the data model**, not the Shopify
app itself. Built and working:

- the store mirror schema (`supabase/schema.sql`)
- the catalog layer, the agent pipeline, the tools, the persona, the guardrails
- a terminal chat harness, a tool-layer smoke test, and a 40-case eval set

Not built yet, in the order it should be built:

1. **Scaffold the embedded app** — `shopify app init --template reactRouter`.
   This needs your Partner login, which is why it is not done yet. It brings
   OAuth, session storage, webhook HMAC verification and the embedded admin
   shell, all pre-wired.
2. **`SupabaseCatalog`** — the same `CatalogRepository` interface that
   `MemoryCatalog` implements, backed by the `match_products()` SQL function.
   The agent will not know the difference.
3. **Sync** — bulk operation on install, webhooks for changes, daily reconcile.
4. **The widget** — theme app extension with an app embed block, talking to the
   backend through Shopify's App Proxy.

Step 2 is the one to do first once the tables exist: the moment it lands, the
same `npm run chat` you are already using talks to a real store's catalog.
