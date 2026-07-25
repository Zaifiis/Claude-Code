// Minimal in-memory stand-in for the Supabase client, supporting exactly
// the query shapes tools.js uses. It also reproduces the 5-minute edit
// window trigger so the mock test verifies the DB backstop, not just the
// app-layer check. `nowFn` lets tests fast-forward time.
const EDIT_WINDOW_MS = 5 * 60 * 1000;

export function makeFakeSupabase({ menu = [], nowFn = () => Date.now() } = {}) {
  const store = {
    menu_items: menu.map((m) => ({ ...m })),
    orders: [],
  };
  let seq = 1041;
  let uuid = 1;

  const triggerReject = (oldRow, patch) => {
    const items = 'items' in patch ? patch.items : oldRow.items;
    const total = 'total' in patch ? patch.total : oldRow.total;
    const status = 'status' in patch ? patch.status : oldRow.status;
    const isCustomerEdit =
      JSON.stringify(items) !== JSON.stringify(oldRow.items) ||
      total !== oldRow.total ||
      (status === 'cancelled' && oldRow.status !== 'cancelled');
    if (isCustomerEdit && nowFn() - new Date(oldRow.created_at).getTime() > EDIT_WINDOW_MS) {
      return {
        message: `EDIT_WINDOW_EXPIRED: order ${oldRow.order_no} can no longer be modified or cancelled`,
      };
    }
    return null;
  };

  function builder(table) {
    const ctx = { table, action: 'select', filters: [], payload: null, one: null, orderBy: null };

    const applyFilters = (rows) =>
      ctx.filters.reduce((acc, f) => {
        if (f.op === 'eq') return acc.filter((r) => r[f.col] === f.val);
        if (f.op === 'ilike') {
          const needle = f.val.replace(/%/g, '');
          return acc.filter((r) => String(r[f.col]).includes(needle));
        }
        return acc;
      }, rows);

    const resolve = () => {
      const rows = store[table];
      if (ctx.action === 'select') {
        let out = applyFilters(rows).map((r) => ({ ...r }));
        if (ctx.orderBy) {
          out.sort((a, b) =>
            ctx.orderBy.asc
              ? String(a[ctx.orderBy.col]).localeCompare(String(b[ctx.orderBy.col]))
              : String(b[ctx.orderBy.col]).localeCompare(String(a[ctx.orderBy.col])),
          );
        }
        if (ctx.one) return { data: out[0] ?? null, error: null };
        return { data: out, error: null };
      }
      if (ctx.action === 'insert') {
        const row = {
          id: `uuid-${uuid++}`,
          status: 'new',
          edited: false,
          created_at: new Date(nowFn()).toISOString(),
          ...ctx.payload,
        };
        rows.push(row);
        return { data: ctx.one ? { ...row } : [{ ...row }], error: null };
      }
      if (ctx.action === 'update') {
        const targets = applyFilters(rows);
        for (const r of targets) {
          const rej = triggerReject(r, ctx.payload);
          if (rej) return { data: null, error: rej };
        }
        let updated = null;
        for (const r of targets) {
          Object.assign(r, ctx.payload);
          updated = { ...r };
        }
        return { data: ctx.one ? updated : targets.map((r) => ({ ...r })), error: null };
      }
      return { data: null, error: { message: 'unsupported' } };
    };

    const chain = {
      select() { return chain; },
      insert(payload) { ctx.action = 'insert'; ctx.payload = payload; return chain; },
      update(payload) { ctx.action = 'update'; ctx.payload = payload; return chain; },
      eq(col, val) { ctx.filters.push({ op: 'eq', col, val }); return chain; },
      ilike(col, val) { ctx.filters.push({ op: 'ilike', col, val }); return chain; },
      order(col, opts = {}) { ctx.orderBy = { col, asc: opts.ascending !== false }; return chain; },
      single() { ctx.one = true; return Promise.resolve(resolve()); },
      maybeSingle() { ctx.one = true; return Promise.resolve(resolve()); },
      then(onOk, onErr) { return Promise.resolve(resolve()).then(onOk, onErr); },
    };
    return chain;
  }

  return {
    from: (table) => builder(table),
    rpc: (name) => {
      if (name === 'next_order_no') return Promise.resolve({ data: `ZQ-${seq++}`, error: null });
      return Promise.resolve({ data: null, error: { message: `no rpc ${name}` } });
    },
  };
}
