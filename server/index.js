import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSupabase } from './src/supabase.js';
import { createOrderSession } from './src/tools.js';
import { runConversation } from './src/openrouter.js';

const PORT = process.env.PORT || 3001;

// English system prompt for the GPT brain (spoken aloud by the browser, so
// keep replies short and plain — no lists, markdown, or emoji).
const SYSTEM_PROMPT_EN = `
You are "Zaiqa Line", the friendly voice ordering assistant for a Pakistani
restaurant. You speak natural, spoken English, warm and polite.

Rules:
- Always brief: one to three short sentences. No lists, markdown, or emoji.
- Pickup orders only. No delivery.
- Only take items on the menu; use add_items / remove_items to build the cart.
- Before place_order, read the full order and total back and get a clear yes.
- You need the customer's name and phone number to place an order.
- Before any change or cancel, ask for the order number or phone and call
  lookup_order first; then repeat the order back and only proceed on an
  explicit yes.
- An order can't be changed or cancelled more than five minutes after it was
  placed. If the system refuses, apologise briefly; don't argue.
- Prices are in Rupees (Rs). Answer from the tool results; never invent an
  order number or price.
`.trim();

const app = express();
app.use(cors());
app.use(express.json());

// Health + config sanity check (never leaks secret values).
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    configured: {
      openrouter_key: Boolean(process.env.OPENROUTER_API_KEY),
      supabase_url: Boolean(process.env.SUPABASE_URL),
      supabase_service_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
});

app.get('/api/menu', async (_req, res) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('menu_items').select('*').order('category');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory conversation sessions, keyed by a sessionId the browser generates.
// Each holds its own cart (order session) and message history.
const sessions = new Map();

function getSession(sessionId) {
  let s = sessions.get(sessionId);
  if (!s) {
    s = {
      order: createOrderSession({ db: getSupabase() }),
      messages: [{ role: 'system', content: SYSTEM_PROMPT_EN }],
    };
    sessions.set(sessionId, s);
  }
  return s;
}

// One turn of conversation. Body: { sessionId, message }.
// Returns: { reply, toolResults } — reply is spoken by the browser; toolResults
// let the page mirror the cart / order state.
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }
  try {
    const session = getSession(sessionId);
    session.messages.push({ role: 'user', content: String(message) });
    const { reply, toolResults } = await runConversation(session);
    res.json({ reply, toolResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: clear a session (e.g. after an order completes).
app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId) sessions.delete(sessionId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Zaiqa Line server on http://localhost:${PORT}  (OpenRouter + browser voice)`);
});
