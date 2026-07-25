// ─────────────────────────────────────────────────────────────────────
//  Zaiqa Line — Gemini tool (function-call) declarations + handlers
//
//  The six tools: add_items, remove_items, place_order, lookup_order,
//  modify_order, cancel_order.
//
//  Design notes:
//  - Every handler is a pure async function of (ctx, args) so the whole
//    layer can be exercised by the text-only mock test with a fake db and
//    no audio / no real Gemini.
//  - add_items / remove_items mutate an in-memory per-session cart. Nothing
//    hits Postgres until place_order.
//  - modify_order / cancel_order check the 5-minute window in app code for a
//    clean spoken refusal, but the DB trigger is the real backstop: even if
//    this check were bypassed, Postgres rejects the write.
// ─────────────────────────────────────────────────────────────────────

const EDIT_WINDOW_MS = 5 * 60 * 1000;

// ── Tool schemas handed to Gemini ───────────────────────────────────
export const toolDeclarations = [
  {
    name: 'add_items',
    description:
      'Add one or more menu items to the current in-progress order (the cart). Use the menu item id.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Items to add.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Menu item id, e.g. "b1".' },
              qty: { type: 'integer', description: 'Quantity, default 1.' },
            },
            required: ['id'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'remove_items',
    description:
      'Remove items (or reduce quantity) from the current in-progress cart.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              qty: {
                type: 'integer',
                description: 'How many to remove. Omit to remove the line entirely.',
              },
            },
            required: ['id'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'place_order',
    description:
      'Finalize the current cart into a real order. Only call after reading the full order and total back to the customer and getting explicit confirmation.',
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
      },
      required: ['customer_name', 'customer_phone'],
    },
  },
  {
    name: 'lookup_order',
    description:
      'Find an existing order by its order number (e.g. "ZQ-1041") or by the last 7 digits of the phone used to place it.',
    parameters: {
      type: 'object',
      properties: {
        order_no: { type: 'string' },
        phone: { type: 'string', description: 'Full or partial phone; last 7 digits are matched.' },
      },
    },
  },
  {
    name: 'modify_order',
    description:
      'Replace the items on an existing order. Only within 5 minutes of order creation. Confirm the new order with the customer first.',
    parameters: {
      type: 'object',
      properties: {
        order_no: { type: 'string' },
        phone: { type: 'string' },
        items: {
          type: 'array',
          description: 'The complete new item list for the order.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              qty: { type: 'integer' },
            },
            required: ['id'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'cancel_order',
    description:
      'Cancel an existing order. Only within 5 minutes of creation. Confirm with the customer before calling.',
    parameters: {
      type: 'object',
      properties: {
        order_no: { type: 'string' },
        phone: { type: 'string' },
      },
    },
  },
];

// ── Menu cache ──────────────────────────────────────────────────────
async function loadMenu(db) {
  const { data, error } = await db.from('menu_items').select('*');
  if (error) throw new Error(`menu load failed: ${error.message}`);
  const byId = new Map();
  for (const row of data) byId.set(row.id, row);
  return byId;
}

// ── Helpers ─────────────────────────────────────────────────────────
function lastDigits(phone, n = 7) {
  return String(phone || '').replace(/\D/g, '').slice(-n);
}

function describeCart(cart, menu) {
  const lines = [];
  let total = 0;
  for (const { id, qty } of cart) {
    const m = menu.get(id);
    if (!m) continue;
    total += m.price * qty;
    lines.push({ id, name_en: m.name_en, name_ur: m.name_ur, qty, line_total: m.price * qty });
  }
  return { lines, total };
}

async function findOrder(db, { order_no, phone }) {
  if (order_no) {
    const { data } = await db
      .from('orders')
      .select('*')
      .eq('order_no', order_no.trim().toUpperCase())
      .maybeSingle();
    if (data) return data;
  }
  if (phone) {
    const last7 = lastDigits(phone, 7);
    if (last7.length >= 4) {
      const { data } = await db
        .from('orders')
        .select('*')
        .ilike('customer_phone', `%${last7}%`)
        .order('created_at', { ascending: false });
      const match = (data || []).find((o) => lastDigits(o.customer_phone, 7) === last7);
      if (match) return match;
    }
  }
  return null;
}

function withinEditWindow(order, now = Date.now()) {
  return now - new Date(order.created_at).getTime() <= EDIT_WINDOW_MS;
}

// ── Session factory ─────────────────────────────────────────────────
// One per WebSocket connection. Holds the in-memory cart and exposes a
// dispatch(name, args) that routes to the correct handler. `now` is
// injectable so the mock test can fast-forward the clock.
export function createOrderSession({ db, now = () => Date.now() }) {
  const cart = []; // [{ id, qty }]
  let menuPromise = null;
  const menu = () => (menuPromise ??= loadMenu(db));

  function upsertCart(id, qty) {
    const line = cart.find((c) => c.id === id);
    if (line) line.qty += qty;
    else cart.push({ id, qty });
  }

  const handlers = {
    async add_items({ items = [] }) {
      const m = await menu();
      const added = [];
      const unknown = [];
      for (const it of items) {
        const qty = Math.max(1, Number(it.qty) || 1);
        if (!m.has(it.id)) { unknown.push(it.id); continue; }
        upsertCart(it.id, qty);
        added.push({ id: it.id, qty, name_ur: m.get(it.id).name_ur });
      }
      const { lines, total } = describeCart(cart, m);
      return { ok: true, added, unknown, cart: lines, total };
    },

    async remove_items({ items = [] }) {
      const m = await menu();
      for (const it of items) {
        const idx = cart.findIndex((c) => c.id === it.id);
        if (idx === -1) continue;
        if (it.qty == null || cart[idx].qty <= it.qty) cart.splice(idx, 1);
        else cart[idx].qty -= Number(it.qty);
      }
      const { lines, total } = describeCart(cart, m);
      return { ok: true, cart: lines, total };
    },

    async place_order({ customer_name, customer_phone }) {
      const m = await menu();
      if (cart.length === 0) return { ok: false, error: 'EMPTY_CART', message: 'Cart is empty.' };
      const { lines, total } = describeCart(cart, m);

      const { data: orderNoRow, error: rpcErr } = await db.rpc('next_order_no');
      if (rpcErr) return { ok: false, error: 'ORDER_NO_FAILED', message: rpcErr.message };

      const items = cart.map(({ id, qty }) => ({ id, qty }));
      const { data, error } = await db
        .from('orders')
        .insert({
          order_no: orderNoRow,
          customer_name,
          customer_phone,
          items,
          total,
          status: 'new',
        })
        .select()
        .single();
      if (error) return { ok: false, error: 'INSERT_FAILED', message: error.message };

      cart.length = 0; // clear the cart after a successful order
      return { ok: true, order_no: data.order_no, total, items: lines };
    },

    async lookup_order({ order_no, phone }) {
      const order = await findOrder(db, { order_no, phone });
      if (!order) return { ok: false, error: 'NOT_FOUND', message: 'No matching order.' };
      const m = await menu();
      const { lines } = describeCart(order.items, m);
      return {
        ok: true,
        order_no: order.order_no,
        customer_name: order.customer_name,
        status: order.status,
        total: order.total,
        items: lines,
        editable: withinEditWindow(order, now()),
        minutes_left: Math.max(
          0,
          Math.ceil((EDIT_WINDOW_MS - (now() - new Date(order.created_at).getTime())) / 60000),
        ),
      };
    },

    async modify_order({ order_no, phone, items = [] }) {
      const order = await findOrder(db, { order_no, phone });
      if (!order) return { ok: false, error: 'NOT_FOUND', message: 'No matching order.' };
      if (!withinEditWindow(order, now())) {
        return {
          ok: false,
          error: 'EDIT_WINDOW_EXPIRED',
          message: 'This order is older than 5 minutes and can no longer be changed.',
        };
      }
      const m = await menu();
      const clean = items
        .filter((it) => m.has(it.id))
        .map((it) => ({ id: it.id, qty: Math.max(1, Number(it.qty) || 1) }));
      if (clean.length === 0) return { ok: false, error: 'EMPTY', message: 'No valid items given.' };
      const { lines, total } = describeCart(clean, m);

      const { data, error } = await db
        .from('orders')
        .update({ items: clean, total, edited: true })
        .eq('id', order.id)
        .select()
        .single();
      if (error) {
        // DB trigger backstop, in case the window elapsed between check & write.
        if (/EDIT_WINDOW_EXPIRED/.test(error.message)) {
          return { ok: false, error: 'EDIT_WINDOW_EXPIRED', message: 'Time window has passed.' };
        }
        return { ok: false, error: 'UPDATE_FAILED', message: error.message };
      }
      return { ok: true, order_no: data.order_no, total, items: lines };
    },

    async cancel_order({ order_no, phone }) {
      const order = await findOrder(db, { order_no, phone });
      if (!order) return { ok: false, error: 'NOT_FOUND', message: 'No matching order.' };
      if (order.status === 'cancelled') return { ok: true, order_no: order.order_no, already: true };
      if (!withinEditWindow(order, now())) {
        return {
          ok: false,
          error: 'EDIT_WINDOW_EXPIRED',
          message: 'This order is older than 5 minutes and can no longer be cancelled.',
        };
      }
      const { data, error } = await db
        .from('orders')
        .update({ status: 'cancelled', edited: true })
        .eq('id', order.id)
        .select()
        .single();
      if (error) {
        if (/EDIT_WINDOW_EXPIRED/.test(error.message)) {
          return { ok: false, error: 'EDIT_WINDOW_EXPIRED', message: 'Time window has passed.' };
        }
        return { ok: false, error: 'CANCEL_FAILED', message: error.message };
      }
      return { ok: true, order_no: data.order_no, status: data.status };
    },
  };

  async function dispatch(name, args = {}) {
    const fn = handlers[name];
    if (!fn) return { ok: false, error: 'UNKNOWN_TOOL', message: `No tool named ${name}` };
    try {
      return await fn(args);
    } catch (err) {
      return { ok: false, error: 'HANDLER_ERROR', message: err.message };
    }
  }

  return { cart, dispatch, handlers };
}
