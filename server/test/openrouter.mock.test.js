// Mock test for the OpenRouter brain — no network, no real key.
// A fake fetch first returns a tool_call (add_items), then a final reply,
// proving the tool loop runs and the cart is updated.
//   node test/openrouter.mock.test.js
import assert from 'node:assert';
import { runConversation } from '../src/openrouter.js';
import { createOrderSession } from '../src/tools.js';
import { makeFakeSupabase } from './fakeSupabase.js';

process.env.OPENROUTER_API_KEY = 'test-key';

const MENU = [
  { id: 'b1', name_en: 'Chicken Biryani', name_ur: 'چکن بریانی', price: 450, category: 'Biryani' },
];
const db = makeFakeSupabase({ menu: MENU });

let calls = 0;
const fakeFetch = async () => {
  calls++;
  if (calls === 1) {
    // First model turn: ask to add 2 biryani.
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_1',
              type: 'function',
              function: { name: 'add_items', arguments: JSON.stringify({ items: [{ id: 'b1', qty: 2 }] }) },
            }],
          },
        }],
      }),
    };
  }
  // Second turn: plain spoken reply.
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { role: 'assistant', content: "That's two Chicken Biryani, 900 rupees." } }],
    }),
  };
};

const run = async () => {
  const session = {
    order: createOrderSession({ db }),
    messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'two biryani' }],
  };
  const { reply, toolResults } = await runConversation(session, { fetchImpl: fakeFetch });

  assert.ok(calls === 2, 'model should be called twice (tool call, then reply)');
  console.log('  ✓ tool loop ran (2 model calls)');
  assert.ok(toolResults.length === 1 && toolResults[0].name === 'add_items', 'add_items ran');
  console.log('  ✓ add_items tool executed');
  assert.ok(toolResults[0].result.total === 900, 'cart total is 900');
  console.log('  ✓ cart total = 900');
  assert.ok(/900/.test(reply), 'final spoken reply returned');
  console.log('  ✓ final reply: "' + reply + '"');
  // History should end with a tool message then the assistant reply.
  assert.ok(session.messages.some((m) => m.role === 'tool'), 'tool result recorded in history');
  console.log('  ✓ tool result stored in history');
  console.log('\nAll checks passed ✅');
};

run().catch((e) => { console.error(e); process.exit(1); });
