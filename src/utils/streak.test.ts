import { describe, it, expect, vi } from 'vitest';

// Stub useMemo so the hook can be called outside a React component tree.
// In a node test environment there is no renderer, so we make useMemo
// simply invoke its factory and return the result.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useMemo: (fn: () => unknown) => fn() };
});

import { getTodayString, getYesterdayString, calculateNewStreak, useStreak } from '../hooks/useStreak';

// ─── getTodayString ───────────────────────────────────────────────────────────

describe('getTodayString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the current UTC date', () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(getTodayString()).toBe(expected);
  });
});

// ─── getYesterdayString ───────────────────────────────────────────────────────

describe('getYesterdayString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getYesterdayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is exactly one day before today', () => {
    const today = new Date(getTodayString());
    const yesterday = new Date(getYesterdayString());
    const diffMs = today.getTime() - yesterday.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});

// ─── calculateNewStreak ───────────────────────────────────────────────────────

describe('calculateNewStreak', () => {
  const TODAY = getTodayString();
  const YESTERDAY = getYesterdayString();

  // ── Already deposited today ──────────────────────────────────────────────
  it('keeps the streak unchanged when depositing again today', () => {
    expect(calculateNewStreak(5, TODAY)).toBe(5);
  });

  it('keeps streak of 1 when depositing again on day 1', () => {
    expect(calculateNewStreak(1, TODAY)).toBe(1);
  });

  // ── Continuing streak from yesterday ────────────────────────────────────
  it('increments streak when last deposit was yesterday', () => {
    expect(calculateNewStreak(5, YESTERDAY)).toBe(6);
  });

  it('starts streak at 1→2 on second consecutive day', () => {
    expect(calculateNewStreak(1, YESTERDAY)).toBe(2);
  });

  // ── Streak broken ────────────────────────────────────────────────────────
  it('resets to 1 when last deposit was two days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateStr = twoDaysAgo.toISOString().slice(0, 10);
    expect(calculateNewStreak(10, dateStr)).toBe(1);
  });

  it('resets to 1 when last deposit was a long time ago', () => {
    expect(calculateNewStreak(99, '2020-01-01')).toBe(1);
  });

  it('returns 1 for the very first deposit (empty lastDepositDate)', () => {
    expect(calculateNewStreak(0, '')).toBe(1);
  });
});

// ─── useStreak ────────────────────────────────────────────────────────────────

describe('useStreak', () => {
  const TODAY = getTodayString();
  const YESTERDAY = getYesterdayString();

  it('reports depositedToday=true and displayStreak=currentStreak when last deposit is today', () => {
    const result = useStreak({ currentStreak: 7, lastDepositDate: TODAY });
    expect(result.depositedToday).toBe(true);
    expect(result.isAlive).toBe(true);
    expect(result.displayStreak).toBe(7);
  });

  it('reports depositedToday=false but isAlive=true when last deposit was yesterday', () => {
    const result = useStreak({ currentStreak: 4, lastDepositDate: YESTERDAY });
    expect(result.depositedToday).toBe(false);
    expect(result.isAlive).toBe(true);
    expect(result.displayStreak).toBe(4);
  });

  it('reports isAlive=false and displayStreak=0 when streak is broken', () => {
    const result = useStreak({ currentStreak: 10, lastDepositDate: '2020-01-01' });
    expect(result.isAlive).toBe(false);
    expect(result.depositedToday).toBe(false);
    expect(result.displayStreak).toBe(0);
  });

  it('handles an empty lastDepositDate (first-time user)', () => {
    const result = useStreak({ currentStreak: 0, lastDepositDate: '' });
    expect(result.isAlive).toBe(false);
    expect(result.depositedToday).toBe(false);
    expect(result.displayStreak).toBe(0);
  });
});
