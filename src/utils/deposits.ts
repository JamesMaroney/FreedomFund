import type { Deposit } from '../types';
import { WEEKLY_TARGETS } from '../constants/presets';

/** Sum of all deposit amounts for today (in cents). */
export function getDailyProgress(deposits: Deposit[], today?: string): number {
  const todayStr = today ?? new Date().toISOString().slice(0, 10);
  return deposits
    .filter((d) => d.timestamp.slice(0, 10) === todayStr)
    .reduce((s, d) => s + d.amount, 0);
}

/** Sum of all deposit amounts in the current calendar week (Sun–Sat, in cents). */
export function getWeeklyProgress(deposits: Deposit[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return deposits
    .filter((d) => new Date(d.timestamp) >= startOfWeek)
    .reduce((s, d) => s + d.amount, 0);
}

/** Sum of all deposit amounts in the current calendar month (in cents). */
export function getMonthlyProgress(deposits: Deposit[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return deposits
    .filter((d) => new Date(d.timestamp) >= startOfMonth)
    .reduce((s, d) => s + d.amount, 0);
}

/** Weekly savings target in cents for the given week of the 12-week challenge. */
export function getWeeklyTarget(challengeStartDate: string): number {
  const start = new Date(challengeStartDate);
  const now = new Date();
  const weekNumber = Math.floor(
    (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  const clampedWeek = Math.min(Math.max(weekNumber, 0), WEEKLY_TARGETS.length - 1);
  return (WEEKLY_TARGETS[clampedWeek] ?? 100) * 100;
}

/** Sum of all unsent (not-yet-transferred) deposit amounts (in cents). */
export function getUnsentCents(deposits: Deposit[]): number {
  return deposits
    .filter((d) => !d.transferred)
    .reduce((sum, d) => sum + d.amount, 0);
}

/** Mark all deposits as transferred, returning the updated array. */
export function markAllTransferred(deposits: Deposit[]): Deposit[] {
  return deposits.map((d) => ({ ...d, transferred: true }));
}

/**
 * Find the first milestone (in dollars) that has just been crossed by a new deposit.
 * Returns the milestone dollar amount, or undefined if none crossed.
 */
export function findNewMilestone(
  milestoneAmountsDollars: number[],
  previousMilestonesCents: number[],
  newTotalCents: number,
): number | undefined {
  return milestoneAmountsDollars.find(
    (m) => !previousMilestonesCents.includes(m * 100) && newTotalCents >= m * 100,
  );
}
