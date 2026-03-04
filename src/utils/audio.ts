// A tiny silent MP3 as a data URL — playing this via HTMLAudioElement
// moves audio routing to the media channel, which bypasses iOS mute switch.
const SILENT_MP3 =
  "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";

let _audioEl: HTMLAudioElement | null = null;
let _ctx: AudioContext | null = null;
// Promise that resolves once the context is fully running.
// Reused so concurrent callers don't each try to resume independently.
let _resumePromise: Promise<void> | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!_audioEl) {
    _audioEl = new Audio();
    _audioEl.src = SILENT_MP3;
    _audioEl.volume = 0;
  }
  return _audioEl;
}

function getAudioCtx(): AudioContext | null {
  if (_ctx && _ctx.state !== "closed") return _ctx;
  try {
    const AudioCtx =
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext ?? AudioContext;
    if (typeof AudioCtx === "undefined") return null;
    _ctx = new AudioCtx();
    _resumePromise = null; // new context, reset resume promise
    return _ctx;
  } catch {
    return null;
  }
}

/** Call this inside a user-gesture handler to unlock audio. */
export const primeAudio = (): void => {
  try {
    // Play the silent clip to unlock the media channel (iOS mute-switch bypass)
    void getAudioEl()
      .play()
      .catch(() => {});
    // Kick off context resume; store the promise so withCtx can await it
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") {
      _resumePromise = ctx.resume();
    }
  } catch {
    // silent
  }
};

async function withCtx(
  fn: (ctx: AudioContext, t: number) => void,
): Promise<void> {
  try {
    void getAudioEl()
      .play()
      .catch(() => {});
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Await the shared resume promise if the context is still suspended.
    // On the happy path (primeAudio was called one gesture earlier) the
    // context is already 'running' and this is a no-op.
    if (ctx.state === "suspended") {
      if (!_resumePromise) _resumePromise = ctx.resume();
      await _resumePromise;
    }
    fn(ctx, ctx.currentTime + 0.03);
  } catch {
    // silent
  }
}

// ─── Sound: "Sonic rings" — scatter of descending coin pings ────────────────
export const playCoinSound = (): Promise<void> =>
  withCtx((ctx, t) => {
    // 6 coin pings at random intervals, each a short sine blip falling in pitch
    const pitches = [1600, 1400, 1800, 1200, 1500, 1350];
    const delays = [0, 0.04, 0.08, 0.13, 0.18, 0.24];
    pitches.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + delays[i]);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 0.5,
        t + delays[i] + 0.12,
      );
      gain.gain.setValueAtTime(0.28, t + delays[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.14);
      osc.start(t + delays[i]);
      osc.stop(t + delays[i] + 0.15);
    });
  });

// ─── Sound: "Ta-da" — two-note brass fanfare ────────────────────────────────
export const playTadaSound = (): Promise<void> =>
  withCtx((ctx, t) => {
    // Helper: one brass-ish note (sawtooth + slight detune for thickness)
    function brass(freq: number, start: number, duration: number, vol: number) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      // Slight high-cut to soften the sawtooth edge
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.type = "sawtooth";
      osc1.frequency.value = freq;
      osc2.type = "sawtooth";
      osc2.frequency.value = freq * 1.005; // slight detune
      // Attack → sustain → release
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.03);
      gain.gain.setValueAtTime(vol, start + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + duration);
      osc2.stop(start + duration);
    }

    // Short pickup note then the triumphant chord
    brass(392, t, 0.12, 0.18); // G4 — quick pickup
    brass(523, t + 0.13, 0.45, 0.22); // C5 — main note
    brass(659, t + 0.13, 0.45, 0.18); // E5 — third (harmony)
    brass(784, t + 0.13, 0.45, 0.14); // G5 — fifth (harmony)
  });

// ─── Sound: original "boing" spring (kept as option) ────────────────────────
export const playSpringSound = (): Promise<void> =>
  withCtx((ctx, t) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.frequency.setValueAtTime(987, t);
    osc1.frequency.exponentialRampToValueAtTime(1318, t + 0.1);
    osc2.frequency.setValueAtTime(1318, t);
    osc2.frequency.exponentialRampToValueAtTime(1760, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.4);
    osc2.stop(t + 0.4);
  });
