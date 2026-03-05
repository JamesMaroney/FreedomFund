import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateId } from './id';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── generateId ───────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('uses crypto.randomUUID when available', () => {
    const fakeUUID = 'aaaabbbb-cccc-4ddd-eeee-ffffffffffff';
    const spy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(fakeUUID as `${string}-${string}-${string}-${string}-${string}`);
    expect(generateId()).toBe(fakeUUID);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('returns a UUID-shaped string from the fallback when crypto.randomUUID is unavailable', () => {
    // Remove randomUUID to force the Math.random fallback path
    vi.stubGlobal('crypto', {});
    const id = generateId();
    // RFC4122 v4: 8-4-4-4-12 hex characters
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique ids across multiple calls with the fallback', () => {
    vi.stubGlobal('crypto', {});
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });

  it('generates unique ids with crypto.randomUUID', () => {
    // Let Node's real crypto.randomUUID run
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });
});
