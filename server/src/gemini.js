import { GoogleGenAI, Modality } from '@google/genai';
import { SYSTEM_PROMPT } from './prompt.js';
import { toolDeclarations, createOrderSession } from './tools.js';

// Audio format the browser sends us and that Gemini Live expects for input.
const INPUT_MIME = 'audio/pcm;rate=16000';

// Bridge a single browser WebSocket <-> a Gemini Live session.
// `send` is a function that pushes a JSON message down to the browser.
export async function bridgeGeminiLive({ db, send, onClose }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL_ID;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  if (!model) throw new Error('GEMINI_MODEL_ID not set');

  const order = createOrderSession({ db });
  const ai = new GoogleGenAI({ apiKey });

  const config = {
    responseModalities: [Modality.AUDIO],
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toolDeclarations }],
    // Live captions of both sides.
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };

  const session = await ai.live.connect({
    model,
    config,
    callbacks: {
      onopen: () => send({ type: 'status', state: 'ready' }),
      onerror: (e) => send({ type: 'error', message: e?.message || String(e) }),
      onclose: () => onClose?.(),
      onmessage: (msg) => handleGeminiMessage(msg, { session, order, send }),
    },
  });

  return {
    // Forward mic PCM (base64) from the browser to Gemini.
    sendAudio(base64) {
      session.sendRealtimeInput({ audio: { data: base64, mimeType: INPUT_MIME } });
    },
    // Text fallback — send a typed user turn.
    sendText(text) {
      session.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
    },
    close() {
      try { session.close(); } catch { /* already closed */ }
    },
  };
}

async function handleGeminiMessage(msg, { session, order, send }) {
  if (msg.setupComplete) {
    send({ type: 'status', state: 'listening' });
    return;
  }

  // Tool / function calls from the model.
  if (msg.toolCall?.functionCalls?.length) {
    const functionResponses = [];
    for (const call of msg.toolCall.functionCalls) {
      send({ type: 'tool', name: call.name, args: call.args });
      const result = await order.dispatch(call.name, call.args || {});
      // Let the browser mirror cart / order state without a DB round-trip.
      send({ type: 'tool_result', name: call.name, result });
      functionResponses.push({ id: call.id, name: call.name, response: result });
    }
    session.sendToolResponse({ functionResponses });
    return;
  }

  const sc = msg.serverContent;
  if (!sc) return;

  // Captions.
  if (sc.inputTranscription?.text) {
    send({ type: 'caption', who: 'user', text: sc.inputTranscription.text });
  }
  if (sc.outputTranscription?.text) {
    send({ type: 'caption', who: 'agent', text: sc.outputTranscription.text });
  }

  // Streamed spoken audio back to the browser.
  const parts = sc.modelTurn?.parts || [];
  for (const p of parts) {
    if (p.inlineData?.data) {
      send({ type: 'audio', data: p.inlineData.data, mimeType: p.inlineData.mimeType });
    }
  }

  if (sc.interrupted) send({ type: 'interrupted' });
  if (sc.turnComplete) send({ type: 'turn_complete' });
}
