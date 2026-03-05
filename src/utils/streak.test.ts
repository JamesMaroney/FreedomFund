import { describe, it, expect } from 'vitest';
import { getTodayString, getYesterdayString, calculateNewStreak } from '../hooks/useStreak';

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
