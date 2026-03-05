import type { AppUIState, AppAction } from '../types';

export function uiReducer(state: AppUIState, action: AppAction): AppUIState {
  switch (action.type) {
    case 'OPEN_SELECTOR':
      return { ...state, screen: 'SELECTING_AMOUNT' };
    case 'CONFIRM_DEPOSIT':
      return {
        ...state,
        screen: 'CELEBRATING',
        pendingAmount: action.amount,
        pendingLabel: action.label,
      };
    case 'CELEBRATION_COMPLETE':
      return { ...state, screen: 'TRANSFER_PROMPT' };
    case 'MARK_TRANSFERRED':
    case 'DISMISS':
      return {
        screen: 'IDLE',
        pendingAmount: 0,
        pendingLabel: '',
      };
    default:
      return state;
  }
}

export const INITIAL_UI: AppUIState = {
  screen: 'IDLE',
  pendingAmount: 0,
  pendingLabel: '',
};
