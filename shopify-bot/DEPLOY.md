# Deploying

Two things run: the **backend** (a Node HTTP server) and the **widget** (files
Shopify hosts inside the merchant's theme). Only the backend needs hosting.

---

## Local development

You do not need any hosting to work on the bot. Everything below runs on your
laptop.

```bash
npm run chat    # talk to the bot in the terminal
npm run eval    # 40-case eval set
npm run smoke   # 50 checks, no model involved
npm run serve   # the backend, on :3000
```

With no Supabase credentials `npm run serve` serves the fixture store and warns
that conversations are not being saved. That is deliberate: it lets you build
and test the widget before the database exists.

### Testing the widget on a real storefront

```bash
npx @shopify/cli@latest app config link    # binds shopify.app.toml to your app
npx @shopify/cli@latest app dev            # tunnels a public URL to your laptop
```

`app dev` prints a tunnel URL and, with `automatically_update_urls_on_dev`,
writes it into your app's settings, so the app proxy points at your machine.
Then, in the store admin:

**Online Store → Themes → Customize → App embeds → Chat widget → toggle on → Save**

That last step is the one every merchant gets stuck on. There is no way to
enable an app embed block for them from the app; plan onboarding around it.

---

## Production

### Backend

Any host that runs a Node process and supports **streaming responses** works.
That second requirement rules out some serverless platforms: the chat endpoint
holds an SSE connection open for several seconds, and a platform that buffers
the whole response destroys the streaming that makes the bot feel fast.

Known-good shapes: a small VPS, Railway, Render, Fly.io, or a container
anywhere. Node 20.9+.

```bash
npm ci
npm run serve
```

Put it behind TLS — Shopify will not call an http:// proxy URL.

**If you use nginx**, turn buffering off for the chat route or SSE will arrive
in one lump at the end:

```nginx
location /apps/chat {
    proxy_pass              http://127.0.0.1:3000;
    proxy_buffering         off;
    proxy_cache             off;
    proxy_read_timeout      120s;
}
```

The server already sends `X-Accel-Buffering: no`, which nginx honours, but the
explicit config is worth having.

### Environment

Copy `.env.example` and fill it in. Required in production:

| Variable | Why |
|---|---|
| `SHOPIFY_API_SECRET` | Verifies that requests came from Shopify. The server refuses to start without it. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | The store mirror and conversation log. |
| `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) | The model. Also covers embeddings if OpenAI. |
| `PORT` | Defaults to 3000. |

The service role key bypasses every RLS policy in the database. It belongs on
the server only — never in the widget, never in a repo, never in a browser.

### Push the app config to Shopify

```bash
npx @shopify/cli@latest app deploy
```

That sends the scopes, app proxy and webhook subscriptions from
`shopify.app.toml`. Replace every `REPLACE-WITH-YOUR-URL` with your real domain
first.

### Keeping the catalog fresh

Webhooks handle changes as they happen. Add a daily reconcile as the safety net
— Shopify's own docs say not to rely on webhook delivery:

```
0 3 * * *  cd /path/to/shopify-bot && npm run sync
```

---

## Going live checklist

- [ ] Schema applied (`supabase/schema.sql`) and `npm run sync` completed
- [ ] Store has real policy pages — shipping, returns, **COD stated explicitly**
- [ ] `npm run eval` passes against the real model, not the mock
- [ ] Backend reachable over HTTPS; `/health` returns ok
- [ ] `shopify app deploy` run; proxy and webhooks visible in the dashboard
- [ ] App embed enabled in the theme, widget visible on the storefront
- [ ] A test conversation ends with a working cart link
- [ ] Spend limit set on the model account
- [ ] `bot_settings` reviewed per shop — especially `max_discount_percent`

---

## Before selling to other merchants

The custom-app token path works for one store. Public distribution needs:

1. **OAuth install flow** — `/auth` and `/auth/callback`, storing each shop's
   offline token in `shops.access_token`. Encrypt it at rest; the column exists
   and the sync already reads from it.
2. **Shopify Billing API** — subscription plans, or you cannot charge.
3. **Protected customer data approval** — only if you add order tracking.
4. **App Store listing and review** — the GDPR webhooks are already implemented,
   which is usually the part people retrofit painfully.

None of that changes the sync, the agent or the widget. It is the wrapper
around them.
