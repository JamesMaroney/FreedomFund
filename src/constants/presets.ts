import { generateId } from '../utils/id'
import { detectSystemLocale } from '../utils/currency'
import type { TipPreset, Goals } from '../types'

export type { TipPreset }

export const DEFAULT_TIP_PRESETS: TipPreset[] = [
  { id: generateId(), amount: 600,  label: 'Coffee',       emoji: '☕', description: 'Skipped Dunkin\'' },
  { id: generateId(), amount: 900,  label: 'Fast food',    emoji: '🍔', description: 'Packed lunch instead' },
  { id: generateId(), amount: 1800, label: 'Amazon order', emoji: '📦', description: 'Left it in the cart' },
  { id: generateId(), amount: 2000, label: 'Waffle House', emoji: '🧇', description: 'Ate at home' },
  { id: generateId(), amount: 2500, label: 'Drinks out',   emoji: '🍺', description: 'Stayed in' },
  { id: generateId(), amount: 3000, label: 'Solo dinner',  emoji: '🍽️', description: 'Cooked instead' },
  { id: generateId(), amount: 3500, label: 'Walmart run',  emoji: '🛒', description: 'Didn\'t need it' },
]

export const DEFAULT_GOALS: Goals = {
  dailyCents:   1000,   // $10
  weeklyCents:  10000,  // $100
  monthlyCents: 40000,  // $400
}

/** Weekly savings targets in dollars for the 12-week challenge */
export const WEEKLY_TARGETS = [50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325];

/** All-time totals (in dollars) that trigger special milestone celebrations */
export const MILESTONE_AMOUNTS = [50, 100, 250, 500, 1000, 2000, 5000];

export const DEFAULT_WEEKLY_GOAL_CENTS = 10000; // $100

export const DEFAULT_PROJECTION_SETTINGS = {
  annualRatePct: 7,
  horizons: [10, 20, 30] as [number, number, number],
};

export const DEFAULT_CURRENCY_LOCALE = detectSystemLocale();

// Keep legacy export name so AmountSelector doesn't break before we migrate it
export const SKIP_PRESETS = DEFAULT_TIP_PRESETS
