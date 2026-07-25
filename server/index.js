import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { getSupabase } from './src/supabase.js';
import { bridgeGeminiLive } from './src/gemini.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Health + config sanity check (never leaks secret values).
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    gemini_model: process.env.GEMINI_MODEL_ID || null,
    configured: {
      gemini_key: Boolean(process.env.GEMINI_API_KEY),
      supabase_url: Boolean(process.env.SUPABASE_URL),
      supabase_service_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
});

// Menu endpoint so the frontend can render the list without the anon key
// (handy in dev; the client can also read Supabase directly).
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

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/voice' });

wss.on('connection', async (ws) => {
  const send = (obj) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  };

  let bridge = null;
  try {
    bridge = await bridgeGeminiLive({
      db: getSupabase(),
      send,
      onClose: () => send({ type: 'status', state: 'closed' }),
    });
  } catch (err) {
    send({ type: 'error', message: `bridge init failed: ${err.message}` });
    ws.close();
    return;
  }

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return; }
    switch (m.type) {
      case 'audio': bridge.sendAudio(m.data); break;   // base64 PCM16 @ 16kHz
      case 'text':  bridge.sendText(m.text); break;    // typed fallback
      case 'end':   bridge.close(); break;
      default: break;
    }
  });

  ws.on('close', () => bridge?.close());
  ws.on('error', () => bridge?.close());
});

server.listen(PORT, () => {
  console.log(`Zaiqa Line server on http://localhost:${PORT}  (ws: /voice)`);
});
