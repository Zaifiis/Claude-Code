import { useEffect, useState } from 'react';

const WINDOW_MS = 5 * 60 * 1000;
const STATUS_UR = {
  new: 'نیا',
  preparing: 'تیاری میں',
  ready: 'تیار',
  completed: 'مکمل',
  cancelled: 'منسوخ',
};

function fmt(ms) {
  if (ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Countdown({ createdAt, now }) {
  const left = WINDOW_MS - (now - new Date(createdAt).getTime());
  const cls = left <= 0 ? 'locked' : left < 60_000 ? 'closing' : 'open';
  return (
    <div className={`countdown ${cls}`}>
      <span className="dot" />
      {left > 0 ? (
        <span>ترمیم کی مہلت: {fmt(left)} باقی</span>
      ) : (
        <span>ترمیم کی مہلت ختم — آرڈر پکا</span>
      )}
    </div>
  );
}

function Ticket({ order, menu, now, onStatus }) {
  const nameOf = (id) => menu.get(id)?.name_ur || id;
  const s = order.status;
  return (
    <div className={`ticket ${s}`}>
      <div className="ticket-top">
        <span className="ticket-no">{order.order_no}</span>
        <span>
          <span className={`badge ${s}`}>{STATUS_UR[s] || s}</span>
          {order.edited && <span className="badge edited">ترمیم شدہ</span>}
        </span>
      </div>
      <div className="cust">
        {order.customer_name} · {order.customer_phone}
      </div>
      <ul className="ticket-items">
        {order.items.map((it) => (
          <li key={it.id}>
            <span className="ur"><span className="qty">×{it.qty}</span>{nameOf(it.id)}</span>
          </li>
        ))}
      </ul>
      <Countdown createdAt={order.created_at} now={now} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Total</span>
        <span className="price">Rs {order.total}</span>
      </div>
      {s !== 'completed' && s !== 'cancelled' && (
        <div className="ticket-actions">
          <button className="act ember" disabled={s !== 'new'} onClick={() => onStatus(order, 'preparing')}>
            پکانا شروع
          </button>
          <button className="act primary" disabled={s !== 'preparing'} onClick={() => onStatus(order, 'ready')}>
            تیار
          </button>
          <button className="act green" disabled={s !== 'ready'} onClick={() => onStatus(order, 'completed')}>
            دے دیا
          </button>
        </div>
      )}
    </div>
  );
}

export default function KitchenRail({ orders, menu, onStatus }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (orders.length === 0) {
    return <div className="empty-note">ابھی کوئی آرڈر نہیں۔ New orders will appear here live.</div>;
  }

  return (
    <div className="rail">
      {orders.map((o) => (
        <Ticket key={o.id} order={o} menu={menu} now={now} onStatus={onStatus} />
      ))}
    </div>
  );
}
