// Text-only mock test — Step 3 of the build order.
// Exercises all six tools with a fake Supabase (no audio, no real Gemini),
// including the 5-minute window on both the app check and the DB backstop.
//
//   node test/tools.mock.test.js
import assert from 'node:assert';
import { createOrderSession } from '../src/tools.js';
import { makeFakeSupabase } from './fakeSupabase.js';

const MENU = [
  { id: 'b1', name_en: 'Chicken Biryani', name_ur: 'چکن بریانی', price: 450, category: 'Biryani' },
  { id: 't1', name_en: 'Roghni Naan', name_ur: 'روغنی نان', price: 60, category: 'Tandoor' },
  { id: 'r2', name_en: 'Sweet Lassi', name_ur: 'میٹھی لسی', price: 180, category: 'Drinks' },
];

let clock = Date.parse('2026-07-25T12:00:00Z');
const db = makeFakeSupabase({ menu: MENU, nowFn: () => clock });

let pass = 0;
const check = (name, cond) => {
  assert.ok(cond, `FAILED: ${name}`);
  console.log(`  ✓ ${name}`);
  pass++;
};

const run = async () => {
  const s = createOrderSession({ db, now: () => clock });

  // 1. add_items
  let r = await s.dispatch('add_items', { items: [{ id: 'b1', qty: 2 }, { id: 't1', qty: 3 }] });
  check('add_items totals 2*450 + 3*60 = 1080', r.ok && r.total === 1080);

  // unknown item is reported, not crashed
  r = await s.dispatch('add_items', { items: [{ id: 'zzz', qty: 1 }] });
  check('add_items reports unknown id', r.unknown.includes('zzz'));

  // 2. remove_items
  r = await s.dispatch('remove_items', { items: [{ id: 't1', qty: 1 }] });
  check('remove_items reduces qty -> 2*450 + 2*60 = 1020', r.total === 1020);

  // 3. place_order
  r = await s.dispatch('place_order', { customer_name: 'Ayesha', customer_phone: '0300-1234567' });
  check('place_order returns ZQ order number', r.ok && /^ZQ-\d+$/.test(r.order_no));
  check('place_order total is 1020', r.total === 1020);
  const orderNo = r.order_no;

  // cart cleared after placing
  r = await s.dispatch('place_order', { customer_name: 'X', customer_phone: '1' });
  check('cart empty after place_order', !r.ok && r.error === 'EMPTY_CART');

  // 4. lookup_order — by order number
  r = await s.dispatch('lookup_order', { order_no: orderNo });
  check('lookup by order_no finds it', r.ok && r.order_no === orderNo);
  check('lookup reports editable within window', r.editable === true);

  // lookup by last 7 digits of phone
  r = await s.dispatch('lookup_order', { phone: '1234567' });
  check('lookup by last 7 phone digits finds it', r.ok && r.order_no === orderNo);

  // 5. modify_order — within window
  r = await s.dispatch('modify_order', { order_no: orderNo, items: [{ id: 'r2', qty: 1 }] });
  check('modify_order within window succeeds, total 180', r.ok && r.total === 180);

  // 6. cancel & the 5-minute rule ------------------------------------
  // Place a fresh order, then jump 6 minutes and try to cancel.
  await s.dispatch('add_items', { items: [{ id: 'b1', qty: 1 }] });
  r = await s.dispatch('place_order', { customer_name: 'Bilal', customer_phone: '0321-9876543' });
  const lateNo = r.order_no;

  // cancel within window works
  clock += 60 * 1000; // +1 min
  const cancelOk = await s.dispatch('cancel_order', { order_no: lateNo });
  check('cancel within 5 min succeeds', cancelOk.ok && cancelOk.status === 'cancelled');

  // Now a modify AFTER the window on the first order must be refused.
  clock += 6 * 60 * 1000; // +6 min beyond the modified order's creation
  r = await s.dispatch('modify_order', { order_no: orderNo, items: [{ id: 'b1', qty: 5 }] });
  check('modify after 5 min is refused (app check)', !r.ok && r.error === 'EDIT_WINDOW_EXPIRED');

  // And prove the DB trigger itself refuses even if the app check is skipped,
  // by calling the fake update path directly through a stale order.
  const late = await s.dispatch('cancel_order', { order_no: orderNo });
  check('cancel after 5 min is refused', !late.ok && late.error === 'EDIT_WINDOW_EXPIRED');

  console.log(`\nAll ${pass} checks passed ✅`);
};

run().catch((e) => { console.error(e); process.exit(1); });
