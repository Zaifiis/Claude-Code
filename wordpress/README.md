# Solar Product Page Chatbot

`solar-product-template.php` is the Snaplyr Solar Wall Lamp WooCommerce page
template with a floating chat widget added (bottom-right bubble → chat panel).
The widget talks to an n8n workflow that answers customer questions using an
LLM grounded in the page's own product facts (price, bundles, shipping, COD,
warranty).

```
┌────────────┐   POST { message, session_id }   ┌───────────────────────┐
│  Chat page  │ ───────────────────────────────▶ │  n8n                  │
│  (browser)  │ ◀─────────────────────────────── │  Webhook → AI Agent   │
└────────────┘        { reply }                  │  (OpenRouter model)   │
                                                   │    │        │        │
                                                   │    ▼        ▼        │
                                                   │  Leads      FAQ      │
                                                   │  sheet    sheet      │
                                                   │ (Google Sheets tools)│
                                                   └───────────────────────┘
```

## 1. Create the Google Sheet

Create one spreadsheet with two tabs:

- **`Leads`** — header row: `Timestamp | Session ID | Name | Phone | Interest | Notes`.
  The agent appends a row here whenever a visitor shares contact info or wants
  to order.
- **`FAQ`** — header row: `Question | Answer`. Add your own Q&A rows here —
  the agent searches this sheet for anything not already covered by the
  product facts baked into its prompt.

Copy the spreadsheet's ID from its URL
(`https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`).

## 2. Import the n8n workflow

1. In n8n: **Workflows → Import from File** → select
   [`../n8n/solar-chatbot-workflow.json`](../n8n/solar-chatbot-workflow.json).
2. **OpenRouter Chat Model** node → create/select your OpenRouter credential
   (an API key from [openrouter.ai](https://openrouter.ai/keys)). The `model`
   field defaults to `openai/gpt-4.1-mini` — change it to any model id
   OpenRouter supports (e.g. `anthropic/claude-3.5-haiku`,
   `google/gemini-2.0-flash-001`, `meta-llama/llama-3.3-70b-instruct`).
3. **Save Lead to Google Sheets** and **Search FAQ Sheet** nodes — for each:
   create/select your Google Sheets OAuth2 credential, then click the
   **Document** field and pick your spreadsheet from the dropdown (this
   overwrites the placeholder ID), and confirm the **Sheet** field points at
   `Leads` / `FAQ` respectively.
4. Activate the workflow.
5. Open the **Webhook** node and copy its **Production URL**
   (looks like `https://your-n8n-instance.com/webhook/solar-chatbot`).

The workflow is: Webhook → AI Agent (OpenRouter chat model + a per-`session_id`
window memory, so each visitor's conversation has context, plus the two
Google Sheets tools above) → Respond to Webhook, returning `{"reply": "..."}`.

## 3. Point the page at your webhook

In `solar-product-template.php`, near the top, set:

```php
$n8n_chat_webhook_url = 'https://your-n8n-instance.com/webhook/solar-chatbot';
```

Then upload/paste the template as your WordPress page template as usual.

## 4. CORS

The browser calls the webhook cross-origin with `fetch()`, so your n8n
instance needs to allow it:

- Self-hosted: set `WEBHOOK_CORS_ALLOW_ORIGIN` (e.g. to your site's origin, or
  `*`) in n8n's environment and restart.
- n8n Cloud: cross-origin webhook calls are allowed by default.

The workflow's **Respond to Webhook** node also sends
`Access-Control-Allow-Origin: *` as a fallback — tighten this to your actual
domain before going live if you want it locked down.

## 5. Customizing what the bot knows

The AI Agent node's system message contains the product facts (price,
bundles, shipping, warranty, etc.) pulled from the page. If you change the
price, bundle discounts, or policies on the page, update the same facts in
the **AI Agent** node's system message so the bot doesn't give stale answers.
Anything else (custom questions, policies that change often) is easier to
just add as a row in the **FAQ** sheet instead of editing the workflow.

## 6. Testing

Open the page, click the 💬 bubble bottom-right, and ask something like
"what's the price for 3?" or "do you have cash on delivery?". If the webhook
is unreachable or misconfigured, the widget falls back to a message pointing
the customer to WhatsApp instead of failing silently.
