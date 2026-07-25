import { MicStreamer, AudioPlayer } from './audio.js';

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/voice`;

// Orchestrates the browser side of the voice session: opens the WebSocket,
// streams mic audio up, plays agent audio down, and surfaces high-level
// events (orb state, captions, tool results) to React via callbacks.
export class VoiceClient {
  constructor(handlers = {}) {
    this.h = handlers; // { onState, onCaption, onTool, onToolResult, onError }
    this.ws = null;
    this.mic = null;
    this.player = new AudioPlayer();
    this.player.onStateChange = (speaking) => {
      if (speaking) this.setState('speaking');
      else if (this.listening) this.setState('listening');
    };
    this.listening = false;
    this.state = 'idle';
  }

  setState(s) {
    this.state = s;
    this.h.onState?.(s);
  }

  connect() {
    this.ws = new WebSocket(WS_URL);
    this.ws.onopen = () => this.setState('thinking');
    this.ws.onerror = () => this.h.onError?.('connection error');
    this.ws.onclose = () => this.setState('idle');
    this.ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
  }

  onMessage(m) {
    switch (m.type) {
      case 'status':
        if (m.state === 'listening') this.setState('listening');
        if (m.state === 'closed') this.setState('idle');
        break;
      case 'audio':
        this.player.enqueue(m.data);
        break;
      case 'caption':
        this.h.onCaption?.(m.who, m.text);
        break;
      case 'tool':
        this.h.onTool?.(m.name, m.args);
        this.setState('thinking');
        break;
      case 'tool_result':
        this.h.onToolResult?.(m.name, m.result);
        break;
      case 'interrupted':
        this.player.flush();
        break;
      case 'turn_complete':
        if (this.listening) this.setState('listening');
        break;
      case 'error':
        this.h.onError?.(m.message);
        break;
      default:
        break;
    }
  }

  async startMic() {
    if (this.mic) return;
    this.mic = new MicStreamer((b64) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'audio', data: b64 }));
      }
    });
    await this.mic.start();
    this.listening = true;
    this.setState('listening');
  }

  stopMic() {
    this.mic?.stop();
    this.mic = null;
    this.listening = false;
    this.setState('idle');
  }

  sendText(text) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
      this.setState('thinking');
    }
  }

  disconnect() {
    this.stopMic();
    this.player.flush();
    try { this.ws?.send(JSON.stringify({ type: 'end' })); } catch { /* noop */ }
    this.ws?.close();
    this.ws = null;
  }
}
