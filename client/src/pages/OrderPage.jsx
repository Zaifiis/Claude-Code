import { useEffect, useRef, useState } from 'react';
import VoiceOrb from '../components/VoiceOrb.jsx';
import Captions from '../components/Captions.jsx';
import MenuList from '../components/MenuList.jsx';
import CartPanel from '../components/CartPanel.jsx';
import { VoiceClient } from '../lib/voiceClient.js';

export default function OrderPage() {
  const [menu, setMenu] = useState([]);
  const [state, setState] = useState('idle');
  const [captions, setCaptions] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [text, setText] = useState('');
  const clientRef = useRef(null);

  // Load menu (via backend so the anon key is optional in dev).
  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMenu(data))
      .catch(() => setError('Menu could not be loaded — is the server running?'));
  }, []);

  const menuById = useRef(new Map());
  useEffect(() => {
    menuById.current = new Map(menu.map((m) => [m.id, m]));
  }, [menu]);

  function ensureClient() {
    if (clientRef.current) return clientRef.current;
    const c = new VoiceClient({
      onState: setState,
      onCaption: (who, textPart) =>
        setCaptions((prev) => {
          // Merge consecutive same-speaker partials into one bubble.
          const last = prev[prev.length - 1];
          if (last && last.who === who) {
            return [...prev.slice(0, -1), { who, text: last.text + textPart }];
          }
          return [...prev, { who, text: textPart }];
        }),
      onToolResult: (name, result) => {
        // Keep the visible cart in sync with the backend's authoritative state.
        if (result?.cart) setCart(result.cart);
        if (name === 'place_order' && result?.ok) {
          setCart([]);
          setCaptions((prev) => [
            ...prev,
            { who: 'agent', text: `آرڈر مکمل! نمبر: ${result.order_no}` },
          ]);
        }
      },
      onError: (msg) => setError(msg),
    });
    c.connect();
    clientRef.current = c;
    return c;
  }

  async function toggleMic() {
    const c = ensureClient();
    if (live) {
      c.stopMic();
      setLive(false);
    } else {
      try {
        await c.startMic();
        setLive(true);
        setError(null);
      } catch {
        setError('Microphone permission denied.');
      }
    }
  }

  function sendText(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const c = ensureClient();
    setCaptions((prev) => [...prev, { who: 'user', text }]);
    c.sendText(text);
    setText('');
  }

  // Local "+" add — optimistic; the voice agent remains the source of truth
  // once an order is placed.
  function addLocal(m) {
    setCart((prev) => {
      const line = prev.find((l) => l.id === m.id);
      if (line) return prev.map((l) => (l.id === m.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: m.id, name_ur: m.name_ur, name_en: m.name_en, qty: 1, line_total: m.price }];
    });
  }

  useEffect(() => () => clientRef.current?.disconnect(), []);

  return (
    <div className="order-grid">
      <div className="panel">
        <h2>Order by Voice</h2>
        <VoiceOrb state={state} />
        <div className="controls">
          <button className={`mic-btn ${live ? 'live' : ''}`} onClick={toggleMic}>
            {live ? '■ روکیں' : '● مائیک'}
          </button>
        </div>
        <form className="text-fallback" onSubmit={sendText} style={{ margin: '14px auto 0' }}>
          <input
            className="ur"
            placeholder="یہاں لکھ کر بھی آرڈر دے سکتے ہیں…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">بھیجیں</button>
        </form>
        {error && <div className="notice" style={{ margin: '14px 0 0' }}>{error}</div>}
        <div style={{ marginTop: 18 }}>
          <h2>Live Captions</h2>
          <Captions lines={captions} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div className="panel">
          <h2>Your Order</h2>
          <CartPanel lines={cart} />
        </div>
        <div className="panel">
          <h2>Menu</h2>
          <MenuList menu={menu} onAdd={addLocal} />
        </div>
      </div>
    </div>
  );
}
