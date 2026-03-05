import { describe, it, expect } from 'vitest';
import {
  getDailyProgress,
  getWeeklyProgress,
  getMonthlyProgress,
  getWeeklyTarget,
  getUnsentCents,
  markAllTransferred,
  findNewMilestone,
} from './deposits';
import type { Deposit } from '../types';
import { WEEKLY_TARGETS } from '../constants/presets';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDeposit(overrides: Partial<Deposit> & { amount: number; timestamp: string }): Deposit {
  return {
    id: 'test-id',
    label: 'Test',
    transferred: false,
    ...overrides,
  };
}

/** Build an ISO timestamp for a date offset (days) relative to today. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** First day of the current month as an ISO timestamp. */
function firstOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** A timestamp guaranteed to be last month. */
function lastMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
}

// ─── getDailyProgress ─────────────────────────────────────────────────────────

describe('getDailyProgress', () => {
  const TODAY = new Date().toISOString().slice(0, 10);

  it('sums deposits made today', () => {
    const deposits = [
      makeDeposit({ amount: 500, timestamp: `${TODAY}T10:00:00.000Z` }),
      makeDeposit({ amount: 300, timestamp: `${TODAY}T14:00:00.000Z` }),
    ];
    expect(getDailyProgress(deposits, TODAY)).toBe(800);
  });

  it('ignores deposits from other days', () => {
    const deposits = [
      makeDeposit({ amount: 500, timestamp: `${TODAY}T10:00:00.000Z` }),
      makeDeposit({ amount: 999, timestamp: daysAgo(1) }),
    ];
    expect(getDailyProgress(deposits, TODAY)).toBe(500);
  });

  it('returns 0 when no deposits today', () => {
    const deposits = [makeDeposit({ amount: 500, timestamp: daysAgo(2) })];
    expect(getDailyProgress(deposits, TODAY)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(getDailyProgress([], TODAY)).toBe(0);
  });

  it('uses current date when today param is omitted', () => {
    const deposits = [makeDeposit({ amount: 100, timestamp: new Date().toISOString() })];
    expect(getDailyProgress(deposits)).toBe(100);
  });
});

// ─── getWeeklyProgress ────────────────────────────────────────────────────────

describe('getWeeklyProgress', () => {
  it('sums deposits from this week', () => {
    // Test with just today to avoid Sun-edge-case where daysAgo(2) = last week
    const today = [makeDeposit({ amount: 400, timestamp: daysAgo(0) })];
    expect(getWeeklyProgress(today)).toBe(400);
  });

  it('excludes deposits older than the start of this week', () => {
    // A deposit exactly 8 days ago is always before the start of this week
    const old = makeDeposit({ amount: 9999, timestamp: daysAgo(8) });
    const recent = makeDeposit({ amount: 100, timestamp: daysAgo(0) });
    expect(getWeeklyProgress([old, recent])).toBe(100);
  });

  it('returns 0 for empty array', () => {
    expect(getWeeklyProgress([])).toBe(0);
  });
});

// ─── getMonthlyProgress ───────────────────────────────────────────────────────

describe('getMonthlyProgress', () => {
  it('sums deposits from this month', () => {
    const deposits = [
      makeDeposit({ amount: 2000, timestamp: firstOfMonth() }),
      makeDeposit({ amount: 1000, timestamp: daysAgo(0) }),
    ];
    expect(getMonthlyProgress(deposits)).toBeGreaterThanOrEqual(3000);
  });

  it('excludes deposits from last month', () => {
    const deposits = [
      makeDeposit({ amount: 9999, timestamp: lastMonth() }),
      makeDeposit({ amount: 500,  timestamp: daysAgo(0) }),
    ];
    expect(getMonthlyProgress(deposits)).toBe(500);
  });

  it('returns 0 for empty array', () => {
    expect(getMonthlyProgress([])).toBe(0);
  });
});

// ─── getWeeklyTarget ─────────────────────────────────────────────────────────

describe('getWeeklyTarget', () => {
  it('returns the first week target for a challenge started today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(getWeeklyTarget(today)).toBe(WEEKLY_TARGETS[0] * 100);
  });

  it('returns the correct target for week 3 (21 days in)', () => {
    const start = new Date();
    start.setDate(start.getDate() - 21);
    const startStr = start.toISOString().slice(0, 10);
    // Week index = floor(21 / 7) = 3
    expect(getWeeklyTarget(startStr)).toBe(WEEKLY_TARGETS[3] * 100);
  });

  it('clamps to the last target after the 12-week challenge ends', () => {
    const start = new Date();
    start.setDate(start.getDate() - 365);
    const startStr = start.toISOString().slice(0, 10);
    expect(getWeeklyTarget(startStr)).toBe(WEEKLY_TARGETS[WEEKLY_TARGETS.length - 1] * 100);
  });

  it('clamps to the first target if start date is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const futureStr = future.toISOString().slice(0, 10);
    expect(getWeeklyTarget(futureStr)).toBe(WEEKLY_TARGETS[0] * 100);
  });
});

// ─── getUnsentCents ──────────────────────────────────────────────────────────

describe('getUnsentCents', () => {
  it('sums only untransferred deposits', () => {
    const deposits = [
      makeDeposit({ amount: 1000, timestamp: daysAgo(0), transferred: false }),
      makeDeposit({ amount: 500,  timestamp: daysAgo(1), transferred: true }),
      makeDeposit({ amount: 250,  timestamp: daysAgo(2), transferred: false }),
    ];
    expect(getUnsentCents(deposits)).toBe(1250);
  });

  it('returns 0 when all deposits are transferred', () => {
    const deposits = [
      makeDeposit({ amount: 1000, timestamp: daysAgo(0), transferred: true }),
    ];
    expect(getUnsentCents(deposits)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(getUnsentCents([])).toBe(0);
  });
});

// ─── markAllTransferred ───────────────────────────────────────────────────────

describe('markAllTransferred', () => {
  it('marks all deposits as transferred', () => {
    const deposits = [
      makeDeposit({ amount: 500, timestamp: daysAgo(0), transferred: false }),
      makeDeposit({ amount: 300, timestamp: daysAgo(1), transferred: false }),
    ];
    const result = markAllTransferred(deposits);
    expect(result.every((d) => d.transferred)).toBe(true);
  });

  it('does not mutate the original array', () => {
    const deposits = [makeDeposit({ amount: 500, timestamp: daysAgo(0), transferred: false })];
    const result = markAllTransferred(deposits);
    expect(deposits[0].transferred).toBe(false); // original unchanged
    expect(result[0].transferred).toBe(true);
  });

  it('preserves all other fields', () => {
    const d = makeDeposit({ id: 'abc', amount: 600, timestamp: daysAgo(0), label: 'Coffee', transferred: false });
    const [result] = markAllTransferred([d]);
    expect(result.id).toBe('abc');
    expect(result.amount).toBe(600);
    expect(result.label).toBe('Coffee');
  });

  it('handles already-transferred deposits gracefully', () => {
    const deposits = [makeDeposit({ amount: 500, timestamp: daysAgo(0), transferred: true })];
    const result = markAllTransferred(deposits);
    expect(result[0].transferred).toBe(true);
  });

  it('returns empty array for empty input', () => {
    expect(markAllTransferred([])).toEqual([]);
  });
});

// ─── findNewMilestone ─────────────────────────────────────────────────────────

describe('findNewMilestone', () => {
  const MILESTONES = [50, 100, 250, 500, 1000];

  it('returns the first milestone crossed by the new total', () => {
    expect(findNewMilestone(MILESTONES, [], 5000)).toBe(50);
  });

  it('returns the milestone at exactly the threshold', () => {
    expect(findNewMilestone(MILESTONES, [], 5000)).toBe(50); // $50 = 5000 cents
  });

  it('skips already-achieved milestones', () => {
    // $50 and $100 already hit — next should be $250
    expect(findNewMilestone(MILESTONES, [5000, 10000], 25000)).toBe(250);
  });

  it('returns undefined when no new milestone is crossed', () => {
    expect(findNewMilestone(MILESTONES, [], 1000)).toBeUndefined(); // only $10, no milestone
  });

  it('returns undefined when total is 0', () => {
    expect(findNewMilestone(MILESTONES, [], 0)).toBeUndefined();
  });

  it('returns undefined when all milestones are already achieved', () => {
    const allHit = MILESTONES.map((m) => m * 100);
    expect(findNewMilestone(MILESTONES, allHit, 999999)).toBeUndefined();
  });

  it('does not double-trigger the same milestone', () => {
    // Both $50 (5000) and $100 (10000) are already in previousMilestones
    // newTotal is exactly $100 — should return undefined, not $50 or $100
    expect(findNewMilestone(MILESTONES, [5000, 10000], 10000)).toBeUndefined();
  });
});
