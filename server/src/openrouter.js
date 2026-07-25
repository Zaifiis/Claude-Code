import { toolDeclarations } from './tools.js';

// OpenRouter is OpenAI-compatible. We reuse the same six tool definitions,
// wrapped in the { type:'function', function:{...} } shape the chat API wants.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const openaiTools = toolDeclarations.map((d) => ({
  type: 'function',
  function: { name: d.name, description: d.description, parameters: d.parameters },
}));

// Runs one user turn to completion: calls the model, executes any tool calls
// against the order session, feeds the results back, and loops until the model
// returns a plain spoken reply. `session` = { order, messages }.
// `fetchImpl` is injectable so the mock test can run without a real network.
export async function runConversation(session, { fetchImpl = fetch } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const toolResults = [];

  for (let step = 0; step < 8; step++) {
    const resp = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Optional attribution headers OpenRouter recommends.
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Zaiqa Line',
      },
      body: JSON.stringify({
        model,
        messages: session.messages,
        tools: openaiTools,
        tool_choice: 'auto',
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`OpenRouter ${resp.status}: ${text.slice(0, 300)}`);
    }

    const data = await resp.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('OpenRouter returned no message');

    // Record the assistant turn (may contain tool_calls) in history.
    session.messages.push(msg);

    if (msg.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* keep {} */ }
        const result = await session.order.dispatch(call.function.name, args);
        toolResults.push({ name: call.function.name, result });
        session.messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue; // ask the model again now that it has the tool results
    }

    return { reply: msg.content || '', toolResults };
  }

  return { reply: "Sorry, I couldn't complete that. Please try again.", toolResults };
}
