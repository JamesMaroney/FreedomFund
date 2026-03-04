export type AudioClip = 'coins' | 'tada' | 'spring' | 'random';

export interface TipPreset {
  id: string;       // stable uuid
  amount: number;   // in cents
  label: string;
  emoji: string;
  description: string;
}

export interface Goals {
  dailyCents: number;
  weeklyCents: number;
  monthlyCents: number;
}

export interface Deposit {
  id: string;
  amount: number; // in cents
  label: string;
  timestamp: string; // ISO datetime
  transferred: boolean;
}

export interface FreedomFundState {
  totalSaved: number;
  currentStreak: number;
  lastDepositDate: string;
  deposits: Deposit[];
  weeklyGoal: number;
  milestones: number[];
  challengeStartDate: string;
  goals: Goals;
  tipPresets: TipPreset[];
}

export type AppScreen =
  | 'IDLE'
  | 'SELECTING_AMOUNT'
  | 'CELEBRATING'
  | 'TRANSFER_PROMPT';

export type AppAction =
  | { type: 'OPEN_SELECTOR' }
  | { type: 'CONFIRM_DEPOSIT'; amount: number; label: string }
  | { type: 'CELEBRATION_COMPLETE' }
  | { type: 'MARK_TRANSFERRED' }
  | { type: 'DISMISS' };

export interface AppUIState {
  screen: AppScreen;
  pendingAmount: number; // cents
  pendingLabel: string;
  lastDepositId: string | null;
}
