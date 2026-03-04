import { useMemo } from 'react';

/** Returns today's ISO date string "YYYY-MM-DD" */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns yesterday's ISO date string */
export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface UseStreakOptions {
  currentStreak: number;
  lastDepositDate: string;
}

export function useStreak({ currentStreak, lastDepositDate }: UseStreakOptions) {
  return useMemo(() => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    const depositedToday = lastDepositDate === today;
    // Streak is alive if deposited today or yesterday (haven't missed yet today)
    const isAlive = lastDepositDate === today || lastDepositDate === yesterday;
    const displayStreak = isAlive ? currentStreak : 0;

    return { displayStreak, depositedToday, isAlive };
  }, [currentStreak, lastDepositDate]);
}

/**
 * Calculate the updated streak value after a new deposit.
 * Returns the new streak count.
 */
export function calculateNewStreak(currentStreak: number, lastDepositDate: string): number {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (lastDepositDate === today) {
    // Already deposited today — streak stays the same
    return currentStreak;
  } else if (lastDepositDate === yesterday) {
    // Continuing streak from yesterday
    return currentStreak + 1;
  } else {
    // Streak broken or first deposit
    return 1;
  }
}
