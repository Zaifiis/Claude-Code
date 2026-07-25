# ذائقہ لائن · Zaiqa Line

An Urdu-speaking **voice ordering agent** for a single restaurant (web only,
pickup only), plus a **live kitchen dashboard**. Speech-to-speech via the
Gemini Live API; orders and realtime updates via Supabase/Postgres.

```
client/   React + Vite voice widget + kitchen rail (plain CSS)
server/   Express + WebSocket bridge to Gemini Live, six order tools
supabase/zaiqa_schema.sql   tables, seed menu, 5-minute edit-window trigger
.env.example                backend env keys (placeholders only)
```

## 1. Configure

```bash
cp .env.example .env                 # backend — fill in real values
cp client/.env.example client/.env   # frontend — anon key + public URL only
```

> ⚠️ The service-role key is **server-side only** and must never be placed in
> any `VITE_*` variable. `GEMINI_MODEL_ID` is read from env because Google
> rotates model ids — it is never hardcoded.

## 2. Database

Run `supabase/zaiqa_schema.sql` in the Supabase SQL editor (or `supabase db
push`). It creates `menu_items` and `orders`, seeds a Pakistani menu, adds the
`ZQ-####` order-number sequence, enables realtime on `orders`, and installs the
**5-minute edit-window trigger**:

> Any change to an order's items/total, or a cancel, is **rejected by Postgres**
> once the order is older than 5 minutes. This lives in the database, so it
> cannot be talked around by the AI or any client. Kitchen status changes
> (new → preparing → ready → completed) are exempt and allowed anytime.

## 3. Backend

```bash
cd server && npm install
npm run test:mock   # text-only test of all six tools + the 5-min rule (no audio)
npm run dev         # starts http://localhost:3001  (ws: /voice)
```

The six Gemini tools: `add_items`, `remove_items`, `place_order`,
`lookup_order` (by order number or last 7 phone digits), `modify_order`,
`cancel_order`. Each reads/writes Supabase with the service-role key;
`modify_order`/`cancel_order` check the 5-minute window in app code **and** are
backstopped by the DB trigger.

## 4. Frontend

```bash
cd client && npm install
npm run dev         # http://localhost:5173  (proxies /api and /voice to :3001)
```

- `#/` — voice widget: animated orb (idle / listening / thinking / speaking),
  mic button, text fallback, live captions, cart + menu.
- `#/kitchen` — kitchen rail: ticket cards, a per-order countdown of the
  5-minute edit window, status buttons, live-updating via Supabase realtime.

## 5. End-to-end test (build step 6)

1. Open `#/kitchen` in one tab, `#/` in another.
2. On the order page, press the mic and place an order in Urdu. The agent reads
   the full order + total back and asks for name/phone before confirming.
3. The new ticket appears on the kitchen rail **without refreshing**, its
   countdown ticking down from 5:00.
4. Say you want to cancel; give the order number or phone. Within 5 minutes the
   agent confirms and the ticket flips to *cancelled* live.
5. Wait past 5 minutes (or use an older order) and try again — the agent
   refuses, because the DB trigger rejects the write.

## Notes

- Gemini Live audio: browser sends PCM16 mono @ 16 kHz; agent audio comes back
  PCM16 @ 24 kHz. See `client/src/lib/audio.js`.
- Design language: warm charcoal ground; brass / marigold / ember accents;
  Noto Nastaliq Urdu for Urdu text.
