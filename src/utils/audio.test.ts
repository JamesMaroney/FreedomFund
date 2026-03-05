import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── AudioContext Mock ────────────────────────────────────────────────────────
// audio.ts uses Web Audio API which doesn't exist in Node. We provide a
// minimal mock that tracks calls, letting us verify the audio functions
// exercise their code paths without real audio hardware.

function makeGainNode() {
  return {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
}

function makeFilter() {
  return {
    connect: vi.fn(),
    type: 'lowpass',
    frequency: { value: 0 },
  };
}

function makeOscillator() {
  return {
    connect: vi.fn(),
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 0,
    },
    start: vi.fn(),
    stop: vi.fn(),
  };
}

// Track the most recently created context so tests can inspect it
let mockCtxInstance: ReturnType<typeof makeMockCtx>;

function makeMockCtx() {
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {} as AudioDestinationNode,
    createOscillator: vi.fn(() => makeOscillator()),
    createGain: vi.fn(() => makeGainNode()),
    createBiquadFilter: vi.fn(() => makeFilter()),
    resume: vi.fn(() => Promise.resolve()),
  };
}

// Stub globals before the module loads (top-level stubs apply at import time)
vi.stubGlobal('window', { webkitAudioContext: undefined });
vi.stubGlobal('AudioContext', vi.fn(function MockAudioContext() {
  mockCtxInstance = makeMockCtx();
  return mockCtxInstance;
}));
vi.stubGlobal('Audio', vi.fn(function MockAudio() {
  return { src: '', volume: 1, play: vi.fn(() => Promise.resolve()) };
}));

// Import audio AFTER globals are stubbed
import { primeAudio, playCoinSound, playTadaSound, playSpringSound } from './audio';

beforeEach(() => {
  // Reset the AudioContext constructor mock call count between tests
  vi.mocked(AudioContext).mockClear();
  vi.mocked(AudioContext).mockImplementation(function MockAudioContext() {
    mockCtxInstance = makeMockCtx();
    return mockCtxInstance as unknown as AudioContext;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── primeAudio ───────────────────────────────────────────────────────────────

describe('primeAudio', () => {
  it('does not throw', () => {
    expect(() => primeAudio()).not.toThrow();
  });
});

// ─── playCoinSound ────────────────────────────────────────────────────────────

describe('playCoinSound', () => {
  it('returns a Promise', () => {
    const result = playCoinSound();
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('creates 6 oscillators (one per coin ping)', async () => {
    // Force a fresh AudioContext by resetting module state indirectly:
    // audio.ts caches _ctx — closing it makes getAudioCtx() create a new one.
    // We achieve this by setting the mock state to 'closed' on the cached ctx.
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playCoinSound();
    expect(mockCtxInstance.createOscillator).toHaveBeenCalledTimes(6);
  });

  it('creates 6 gain nodes', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playCoinSound();
    expect(mockCtxInstance.createGain).toHaveBeenCalledTimes(6);
  });

  it('starts and stops each oscillator', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playCoinSound();
    const oscs = mockCtxInstance.createOscillator.mock.results.map(
      (r) => r.value,
    );
    for (const osc of oscs) {
      expect(osc.start).toHaveBeenCalledOnce();
      expect(osc.stop).toHaveBeenCalledOnce();
    }
  });
});

// ─── playTadaSound ────────────────────────────────────────────────────────────

describe('playTadaSound', () => {
  it('returns a Promise', () => {
    const result = playTadaSound();
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('creates oscillators for the ta-da chord (4 notes × 2 osc each = 8)', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playTadaSound();
    // 4 brass() calls, each creates 2 oscillators = 8 total
    expect(mockCtxInstance.createOscillator).toHaveBeenCalledTimes(8);
  });

  it('creates a biquad filter for each note (4)', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playTadaSound();
    expect(mockCtxInstance.createBiquadFilter).toHaveBeenCalledTimes(4);
  });
});

// ─── playSpringSound ──────────────────────────────────────────────────────────

describe('playSpringSound', () => {
  it('returns a Promise', () => {
    const result = playSpringSound();
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('creates 2 oscillators for the spring boing', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playSpringSound();
    expect(mockCtxInstance.createOscillator).toHaveBeenCalledTimes(2);
  });

  it('creates 1 gain node', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    await playSpringSound();
    expect(mockCtxInstance.createGain).toHaveBeenCalledTimes(1);
  });
});

// ─── graceful degradation when AudioContext is unavailable ───────────────────

describe('audio graceful degradation', () => {
  it('does not throw when AudioContext constructor throws', async () => {
    if (mockCtxInstance) mockCtxInstance.state = 'closed';
    vi.mocked(AudioContext).mockImplementationOnce(() => {
      throw new Error('Not allowed');
    });
    await expect(playCoinSound()).resolves.toBeUndefined();
  });
});

