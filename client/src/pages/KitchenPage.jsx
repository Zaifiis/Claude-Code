import { useEffect, useMemo, useState } from 'react';
import KitchenRail from '../components/KitchenRail.jsx';
import { supabase, supabaseConfigured } from '../lib/supabase.js';

// Sort: active tickets first (new -> preparing -> ready), newest within a
// group; finished/cancelled sink to the bottom.
const RANK = { new: 0, preparing: 1, ready: 2, completed: 3, cancelled: 4 };
const sortOrders = (a, b) =>
  RANK[a.status] - RANK[b.status] || new Date(b.created_at) - new Date(a.created_at);

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState(null);

  const menuMap = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  useEffect(() => {
    fetch('/api/menu').then((r) => r.json()).then((d) => Array.isArray(d) && setMenu(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError('Supabase not configured (set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Live updates are off.');
      return;
    }

    let active = true;
    const load = async () => {
      const { data, error: e } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (e) setError(e.message);
      else setOrders((data || []).sort(sortOrders));
    };
    load();

    // Realtime: apply inserts/updates in place — no manual refresh.
    const channel = supabase
      .channel('orders-kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => {
          const next = [...prev];
          const idx = next.findIndex((o) => o.id === payload.new?.id || o.id === payload.old?.id);
          if (payload.eventType === 'DELETE') {
            if (idx !== -1) next.splice(idx, 1);
          } else if (idx === -1) {
            next.push(payload.new);
          } else {
            next[idx] = payload.new;
          }
          return next.sort(sortOrders);
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function onStatus(order, status) {
    if (!supabaseConfigured) return;
    // Kitchen status progression is not a "customer edit", so the 5-minute
    // trigger allows it at any time.
    const { error: e } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (e) setError(e.message);
  }

  const activeCount = orders.filter((o) => ['new', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div className="kitchen">
      <div className="kitchen-head">
        <h1 className="ur">باورچی خانہ</h1>
        <span className="count">{activeCount} active · {orders.length} total</span>
      </div>
      {error && <div className="notice">{error}</div>}
      <KitchenRail orders={orders} menu={menuMap} onStatus={onStatus} />
    </div>
  );
}
