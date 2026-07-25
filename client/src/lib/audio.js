// Browser audio plumbing for the Gemini Live bridge.
//
// Input  : mic -> PCM16 mono @ 16 kHz -> base64 (what Gemini Live expects).
// Output : base64 PCM16 mono @ 24 kHz (what Gemini streams back) -> speakers.
//
// Uses ScriptProcessorNode for capture — deprecated but universally
// available and adequate for 16 kHz speech.

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

function floatToPCM16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToInt16(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

// Captures mic audio and calls onChunk(base64Pcm16) ~20-40x/sec.
export class MicStreamer {
  constructor(onChunk) {
    this.onChunk = onChunk;
    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.source = null;
  }

  async start() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: INPUT_RATE,
    });
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(2048, 1, 1);
    this.node.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      this.onChunk(int16ToBase64(floatToPCM16(input)));
    };
    this.source.connect(this.node);
    this.node.connect(this.ctx.destination);
  }

  stop() {
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.node = this.source = this.stream = this.ctx = null;
  }
}

// Queues and plays back the 24 kHz PCM chunks Gemini streams.
export class AudioPlayer {
  constructor() {
    this.ctx = null;
    this.nextTime = 0;
    this.onStateChange = null; // (isSpeaking) => void
    this.playing = 0;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: OUTPUT_RATE,
      });
      this.nextTime = this.ctx.currentTime;
    }
  }

  enqueue(b64) {
    this.ensure();
    const int16 = base64ToInt16(b64);
    const float = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float[i] = int16[i] / 0x8000;

    const buffer = this.ctx.createBuffer(1, float.length, OUTPUT_RATE);
    buffer.copyToChannel(float, 0);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);

    const startAt = Math.max(this.ctx.currentTime, this.nextTime);
    src.start(startAt);
    this.nextTime = startAt + buffer.duration;

    this.playing++;
    this.onStateChange?.(true);
    src.onended = () => {
      this.playing--;
      if (this.playing <= 0) this.onStateChange?.(false);
    };
  }

  // Called on a barge-in / interruption to stop scheduled audio.
  flush() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.playing = 0;
      this.onStateChange?.(false);
    }
  }
}
