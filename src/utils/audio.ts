// A tiny silent MP3 as a data URL — playing this via HTMLAudioElement
// moves audio routing to the media channel, which bypasses iOS mute switch.
const SILENT_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV'

let _audioEl: HTMLAudioElement | null = null
let _unlocked = false

function getAudioEl(): HTMLAudioElement {
  if (!_audioEl) {
    _audioEl = new Audio()
    _audioEl.src = SILENT_MP3
    _audioEl.volume = 0
  }
  return _audioEl
}

export const primeAudio = (): void => {
  try {
    const el = getAudioEl()
    el.play().then(() => {
      _unlocked = true
    }).catch(() => {})
  } catch {
    // silent
  }
}

async function withCtx(fn: (ctx: AudioContext) => void): Promise<void> {
  try {
    if (!_unlocked) {
      await getAudioEl().play().catch(() => {})
      _unlocked = true
    }
    const AudioCtx =
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
      AudioContext
    if (typeof AudioCtx === 'undefined') return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    fn(ctx)
    setTimeout(() => ctx.close(), 2000)
  } catch {
    // silent
  }
}

// ─── Sound: "Sonic rings" — scatter of descending coin pings ────────────────
export const playCoinSound = (): Promise<void> => withCtx((ctx) => {
  const t = ctx.currentTime
  // 6 coin pings at random intervals, each a short sine blip falling in pitch
  const pitches = [1600, 1400, 1800, 1200, 1500, 1350]
  const delays  = [0,    0.04, 0.08, 0.13, 0.18, 0.24]
  pitches.forEach((freq, i) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t + delays[i])
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + delays[i] + 0.12)
    gain.gain.setValueAtTime(0.28, t + delays[i])
    gain.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.14)
    osc.start(t + delays[i])
    osc.stop(t + delays[i] + 0.15)
  })
})

// ─── Sound: "Ta-da" — two-note brass fanfare ────────────────────────────────
export const playTadaSound = (): Promise<void> => withCtx((ctx) => {
  const t = ctx.currentTime

  // Helper: one brass-ish note (sawtooth + slight detune for thickness)
  function brass(freq: number, start: number, duration: number, vol: number) {
    const osc1  = ctx.createOscillator()
    const osc2  = ctx.createOscillator()
    const gain  = ctx.createGain()
    // Slight high-cut to soften the sawtooth edge
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2400
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    osc1.type = 'sawtooth'; osc1.frequency.value = freq
    osc2.type = 'sawtooth'; osc2.frequency.value = freq * 1.005 // slight detune
    // Attack → sustain → release
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.03)
    gain.gain.setValueAtTime(vol, start + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc1.start(start); osc2.start(start)
    osc1.stop(start + duration); osc2.stop(start + duration)
  }

  // Short pickup note then the triumphant chord
  brass(392, t,        0.12, 0.18)  // G4 — quick pickup
  brass(523, t + 0.13, 0.45, 0.22)  // C5 — main note
  brass(659, t + 0.13, 0.45, 0.18)  // E5 — third (harmony)
  brass(784, t + 0.13, 0.45, 0.14)  // G5 — fifth (harmony)
})

// ─── Sound: original "boing" spring (kept as option) ────────────────────────
export const playSpringSound = (): Promise<void> => withCtx((ctx) => {
  const t = ctx.currentTime
  const osc1  = ctx.createOscillator()
  const osc2  = ctx.createOscillator()
  const gain  = ctx.createGain()
  osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
  osc1.frequency.setValueAtTime(987, t)
  osc1.frequency.exponentialRampToValueAtTime(1318, t + 0.1)
  osc2.frequency.setValueAtTime(1318, t)
  osc2.frequency.exponentialRampToValueAtTime(1760, t + 0.1)
  gain.gain.setValueAtTime(0.3, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  osc1.start(t); osc2.start(t)
  osc1.stop(t + 0.4); osc2.stop(t + 0.4)
})
