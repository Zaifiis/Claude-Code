# Solar Product Page Chatbot

`solar-product-template.php` is the Snaplyr Solar Wall Lamp WooCommerce page
template with a floating chat widget added (bottom-right bubble → chat panel).
The widget talks to an n8n workflow that answers customer questions using an
LLM grounded in the page's own product facts (price, bundles, shipping, COD,
warranty).

```
┌────────────┐   POST { message, session_id }   ┌──────────────┐
│  Chat page  │ ───────────────────────────────▶ │   n8n         │
│  (browser)  │ ◀─────────────────────────────── │  Webhook →    │
└────────────┘        { reply }                  │  AI Agent     │
                                                   └──────────────┘
```

## 1. Import the n8n workflow

1. In n8n: **Workflows → Import from File** → select
   [`../n8n/solar-chatbot-workflow.json`](../n8n/solar-chatbot-workflow.json).
2. Open **OpenAI Chat Model** and select/create your OpenAI credential
   (its credential ID is a placeholder on purpose). Any chat-model node can be
   swapped in here if you prefer a different provider.
3. Activate the workflow.
4. Open the **Webhook** node and copy its **Production URL**
   (looks like `https://your-n8n-instance.com/webhook/solar-chatbot`).

The workflow is a standard Webhook → AI Agent (with an OpenAI chat model and
a per-`session_id` window memory, so each visitor's conversation has context)
→ Respond to Webhook, returning `{"reply": "..."}`.

## 2. Point the page at your webhook

In `solar-product-template.php`, near the top, set:

```php
$n8n_chat_webhook_url = 'https://your-n8n-instance.com/webhook/solar-chatbot';
```

Then upload/paste the template as your WordPress page template as usual.

## 3. CORS

The browser calls the webhook cross-origin with `fetch()`, so your n8n
instance needs to allow it:

- Self-hosted: set `WEBHOOK_CORS_ALLOW_ORIGIN` (e.g. to your site's origin, or
  `*`) in n8n's environment and restart.
- n8n Cloud: cross-origin webhook calls are allowed by default.

The workflow's **Respond to Webhook** node also sends
`Access-Control-Allow-Origin: *` as a fallback — tighten this to your actual
domain before going live if you want it locked down.

## 4. Customizing what the bot knows

The AI Agent node's system message contains the product facts (price,
bundles, shipping, warranty, etc.) pulled from the page. If you change the
price, bundle discounts, or policies on the page, update the same facts in
the **AI Agent** node's system message so the bot doesn't give stale answers.

## 5. Testing

Open the page, click the 💬 bubble bottom-right, and ask something like
"what's the price for 3?" or "do you have cash on delivery?". If the webhook
is unreachable or misconfigured, the widget falls back to a message pointing
the customer to WhatsApp instead of failing silently.
