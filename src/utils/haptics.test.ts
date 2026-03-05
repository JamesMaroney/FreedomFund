import { describe, it, expect, vi, afterEach } from 'vitest';
import { celebrationVibration, milestoneVibration } from './haptics';

// Mock the entire env module so we control canVibrate's return value
vi.mock('./env', () => ({
  canVibrate: vi.fn(),
}));

import { canVibrate } from './env';
const mockCanVibrate = canVibrate as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.clearAllMocks();
});

// ─── celebrationVibration ─────────────────────────────────────────────────────

describe('celebrationVibration', () => {
  it('calls navigator.vibrate with the celebration pattern when canVibrate is true', () => {
    mockCanVibrate.mockReturnValue(true);
    const vibrateSpy = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateSpy });

    celebrationVibration();

    expect(vibrateSpy).toHaveBeenCalledOnce();
    expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 200]);

    vi.unstubAllGlobals();
  });

  it('does nothing when canVibrate is false', () => {
    mockCanVibrate.mockReturnValue(false);
    const vibrateSpy = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateSpy });

    celebrationVibration();

    expect(vibrateSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

// ─── milestoneVibration ───────────────────────────────────────────────────────

describe('milestoneVibration', () => {
  it('calls navigator.vibrate with the milestone pattern when canVibrate is true', () => {
    mockCanVibrate.mockReturnValue(true);
    const vibrateSpy = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateSpy });

    milestoneVibration();

    expect(vibrateSpy).toHaveBeenCalledOnce();
    expect(vibrateSpy).toHaveBeenCalledWith([100, 50, 100, 50, 100, 50, 300]);

    vi.unstubAllGlobals();
  });

  it('does nothing when canVibrate is false', () => {
    mockCanVibrate.mockReturnValue(false);
    const vibrateSpy = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateSpy });

    milestoneVibration();

    expect(vibrateSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
