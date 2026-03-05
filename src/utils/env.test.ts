import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPWA, isMobile, canVibrate, canPlayAudio } from './env';

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── isPWA ────────────────────────────────────────────────────────────────────

describe('isPWA', () => {
  it('returns true when matchMedia reports standalone display-mode', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
      navigator: {},
    });
    expect(isPWA()).toBe(true);
  });

  it('returns true when navigator.standalone is true (iOS Safari)', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    });
    expect(isPWA()).toBe(true);
  });

  it('returns false when neither matchMedia nor standalone is set', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      navigator: {},
    });
    expect(isPWA()).toBe(false);
  });

  it('returns false when navigator.standalone is explicitly false', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: false },
    });
    expect(isPWA()).toBe(false);
  });
});

// ─── isMobile ─────────────────────────────────────────────────────────────────

describe('isMobile', () => {
  it('returns true for an Android user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      maxTouchPoints: 0,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns true for an iPhone user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      maxTouchPoints: 5,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns true for an iPad user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
      maxTouchPoints: 5,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns true when maxTouchPoints > 1 regardless of userAgent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      maxTouchPoints: 2,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns false for a desktop Chrome user agent with no touch', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      maxTouchPoints: 0,
    });
    expect(isMobile()).toBe(false);
  });
});

// ─── canVibrate ───────────────────────────────────────────────────────────────

describe('canVibrate', () => {
  it('returns true when navigator.vibrate exists', () => {
    vi.stubGlobal('navigator', { vibrate: () => true });
    expect(canVibrate()).toBe(true);
  });

  it('returns false when navigator.vibrate is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(canVibrate()).toBe(false);
  });
});

// ─── canPlayAudio ─────────────────────────────────────────────────────────────

describe('canPlayAudio', () => {
  it('returns true when AudioContext is defined', () => {
    vi.stubGlobal('AudioContext', class MockAudioContext {});
    expect(canPlayAudio()).toBe(true);
  });

  it('returns true when webkitAudioContext is defined but AudioContext is not', () => {
    // Remove AudioContext then set webkitAudioContext on window
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('window', {
      ...(typeof window !== 'undefined' ? window : {}),
      webkitAudioContext: class MockWebkitAudioContext {},
    });
    expect(canPlayAudio()).toBe(true);
  });

  it('returns false when neither AudioContext nor webkitAudioContext is defined', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('window', {});
    expect(canPlayAudio()).toBe(false);
  });

  it('returns false when accessing webkitAudioContext throws', () => {
    vi.stubGlobal('AudioContext', undefined);
    const faultyWindow = {};
    Object.defineProperty(faultyWindow, 'webkitAudioContext', {
      get() { throw new Error('Blocked by browser'); },
    });
    vi.stubGlobal('window', faultyWindow);
    expect(canPlayAudio()).toBe(false);
  });
});
