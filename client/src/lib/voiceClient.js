// Browser-only voice client for Zaiqa Line (English).
//   Listening  -> Web Speech API SpeechRecognition (en-US)
//   Thinking   -> POST /api/chat  (OpenRouter / GPT brain on the server)
//   Speaking   -> Web Speech API speechSynthesis (en-US)
//
// Keeps the same public shape the pages already use: connect(), startMic(),
// stopMic(), sendText(), disconnect(), plus handler callbacks.

const API = '/api/chat';

function newSessionId() {
  return 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class VoiceClient {
  constructor(handlers = {}) {
    this.h = handlers; // { onState, onCaption, onToolResult, onError }
    this.sessionId = newSessionId();
    this.recognition = null;
    this.listening = false;
    this.speaking = false;
    this.state = 'idle';

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = Boolean(SR);
    if (this.supported) {
      const r = new SR();
      r.lang = 'en-US';
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => this.onSpeech(e);
      r.onend = () => {
        // Auto-restart while the mic is meant to be on and we're not speaking.
        if (this.listening && !this.speaking) {
          try { r.start(); } catch { /* already started */ }
        }
      };
      r.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.h.onError?.('Microphone permission denied.');
          this.stopMic();
        }
      };
      this.recognition = r;
    }
  }

  setState(s) {
    this.state = s;
    this.h.onState?.(s);
  }

  connect() {
    if (!this.supported) {
      this.h.onError?.('This browser has no speech recognition. Please use Google Chrome.');
    }
    this.setState('idle');
  }

  onSpeech(e) {
    let finalText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
    }
    if (finalText.trim()) this.send(finalText.trim());
  }

  async startMic() {
    if (!this.supported) {
      this.h.onError?.('This browser has no speech recognition. Please use Google Chrome.');
      throw new Error('unsupported');
    }
    this.listening = true;
    try { this.recognition.start(); } catch { /* already running */ }
    this.setState('listening');
  }

  stopMic() {
    this.listening = false;
    try { this.recognition?.stop(); } catch { /* noop */ }
    if (!this.speaking) this.setState('idle');
  }

  sendText(text) {
    if (text?.trim()) this.send(text.trim());
  }

  async send(text) {
    this.h.onCaption?.('user', text);
    this.setState('thinking');
    // Don't let the mic hear the assistant's own voice.
    try { this.recognition?.stop(); } catch { /* noop */ }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      (data.toolResults || []).forEach((t) => this.h.onToolResult?.(t.name, t.result));
      if (data.reply) {
        this.h.onCaption?.('agent', data.reply);
        this.speak(data.reply);
      } else {
        this.resumeListening();
      }
    } catch (err) {
      this.h.onError?.(err.message);
      this.resumeListening();
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) {
      this.resumeListening();
      return;
    }
    this.speaking = true;
    this.setState('speaking');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 1.0;
    u.onend = () => {
      this.speaking = false;
      this.resumeListening();
    };
    u.onerror = () => {
      this.speaking = false;
      this.resumeListening();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  resumeListening() {
    if (this.listening) {
      this.setState('listening');
      try { this.recognition?.start(); } catch { /* already running */ }
    } else {
      this.setState('idle');
    }
  }

  disconnect() {
    this.listening = false;
    try { this.recognition?.stop(); } catch { /* noop */ }
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    this.setState('idle');
  }
}
