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

Either vendor works — the bot picks whichever key it finds:

- **Anthropic** — <https://console.anthropic.com>. Set `ANTHROPIC_API_KEY`.
- **OpenAI** — <https://platform.openai.com>. Set `OPENAI_API_KEY`. This one
  also covers embeddings, so it is the only key you need.

Without either, the bot falls back to the offline mock and its replies are
templated placeholders.

Both are pay-as-you-go and need credit on the account. A new key with a zero
balance fails with a rate-limit error, which reads confusingly — if you see
that on a brand new key, check the balance before debugging anything else.

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

# Model (from step 5) — set ONE of these
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional model overrides (OpenAI). Defaults: luna for routing, terra for
# replies. gpt-6-astra is the flagship and roughly 5x the price per token.
# OPENAI_ROUTER_MODEL=gpt-5.6-luna
# OPENAI_REPLY_MODEL=gpt-5.6-terra

# Force a provider. BOT_PROVIDER=mock is what CI should use.
# BOT_PROVIDER=mock
```

`.env` is gitignored. Never commit it — the service role key bypasses every RLS
policy in the database, and the Shopify secret lets anyone impersonate your app.

---

## Connect your real store (no OAuth needed yet)

The full embedded app needs `shopify app init` and the Shopify CLI. You do not
need any of that to get your real catalog into the bot — a **custom app token**
is enough, and it takes two minutes.

### 1. Create a custom app in the store admin

In the store admin (not the Partner dashboard):

**Settings → Apps and sales channels → Develop apps → Create an app**

Name it `Sana Sync`, then **Configure Admin API scopes** and tick:

- `read_products`
- `read_inventory`
- `read_content`
- `read_locales`

**Install app**, then reveal and copy the **Admin API access token** (`shpat_...`).

> That token is shown once. It is a password to your store's catalog — put it
> straight into `.env`, never into a commit, a screenshot or a chat message.

### 2. Point the sync at it

In `.env`:

```bash
SHOP_DOMAIN=sana-threads-dev.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# Embeddings: OPENAI_API_KEY covers this too. VOYAGE_API_KEY overrides it.
# VOYAGE_API_KEY=...
```

### 3. Sync, then talk to your own store

```bash
npm run sync
npm run chat
```

`npm run sync` is idempotent — run it as often as you like. It reconciles
deletions, and it only re-embeds products whose text actually changed, so a
stock update costs nothing.

This custom-app token is a **development shortcut**. It works on exactly one
store, which is fine for building. Selling to other merchants needs the OAuth
install flow — same sync code underneath, different way of getting the token.

---

## Putting it on a storefront

Once the catalog is synced, the widget is two commands and one toggle.

```bash
npm run serve                                  # the backend, in one terminal
npx @shopify/cli@latest app config link        # binds shopify.app.toml to your app
npx @shopify/cli@latest app dev                # public tunnel to your machine
```

On Windows PowerShell use `npm.cmd` and `npx.cmd`, or run
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once to stop Windows
blocking them.

Then, in the store admin:

**Online Store → Themes → Customize → App embeds → Chat widget → on → Save**

Open the storefront and the bubble is there. That last toggle is the step every
merchant gets stuck on — there is no way to enable an app embed for them from
the app, so plan your onboarding around it.

`npm run serve` works without Supabase too: it serves the fixture store and
warns that conversations are not being saved, which is enough to test the
widget before the database exists.

Full hosting notes, including the nginx buffering trap that silently breaks
streaming, are in [DEPLOY.md](./DEPLOY.md).

---

## What is not built yet

Everything a single store needs is built: the schema, the catalog sync, the
agent, the backend, the webhooks and the storefront widget.

What is missing is what it takes to sell this to **other** merchants:

1. **OAuth install flow** — so a merchant can click Install and have their own
   token stored. One store works today with a custom app token.
2. **Shopify Billing API** — required before you can charge anyone.
3. **Merchant dashboard** — sync status, the persona settings form, conversation
   transcripts. `bot_settings` is already read from the database; nothing edits
   it yet.
4. **App Store listing and review** — the mandatory GDPR webhooks are already
   implemented, which is the part people usually retrofit painfully.

None of those change the agent, the sync or the widget. They are the wrapper.
