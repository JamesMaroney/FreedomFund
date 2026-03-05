import { describe, it, expect } from 'vitest';
import { uiReducer, INITIAL_UI } from './uiReducer';
import type { AppUIState } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const idle: AppUIState = INITIAL_UI;

// ─── uiReducer ────────────────────────────────────────────────────────────────

describe('uiReducer', () => {
  // OPEN_SELECTOR
  describe('OPEN_SELECTOR', () => {
    it('transitions IDLE → SELECTING_AMOUNT', () => {
      const next = uiReducer(idle, { type: 'OPEN_SELECTOR' });
      expect(next.screen).toBe('SELECTING_AMOUNT');
    });

    it('preserves pendingAmount and pendingLabel', () => {
      const state: AppUIState = { screen: 'IDLE', pendingAmount: 0, pendingLabel: '' };
      const next = uiReducer(state, { type: 'OPEN_SELECTOR' });
      expect(next.pendingAmount).toBe(0);
      expect(next.pendingLabel).toBe('');
    });
  });

  // CONFIRM_DEPOSIT
  describe('CONFIRM_DEPOSIT', () => {
    it('transitions SELECTING_AMOUNT → CELEBRATING', () => {
      const state: AppUIState = { screen: 'SELECTING_AMOUNT', pendingAmount: 0, pendingLabel: '' };
      const next = uiReducer(state, { type: 'CONFIRM_DEPOSIT', amount: 600, label: 'Coffee' });
      expect(next.screen).toBe('CELEBRATING');
    });

    it('sets pendingAmount and pendingLabel from the action', () => {
      const next = uiReducer(idle, { type: 'CONFIRM_DEPOSIT', amount: 1500, label: 'Lunch' });
      expect(next.pendingAmount).toBe(1500);
      expect(next.pendingLabel).toBe('Lunch');
    });
  });

  // CELEBRATION_COMPLETE
  describe('CELEBRATION_COMPLETE', () => {
    it('transitions CELEBRATING → TRANSFER_PROMPT', () => {
      const state: AppUIState = { screen: 'CELEBRATING', pendingAmount: 600, pendingLabel: 'Coffee' };
      const next = uiReducer(state, { type: 'CELEBRATION_COMPLETE' });
      expect(next.screen).toBe('TRANSFER_PROMPT');
    });

    it('preserves pendingAmount through the transition', () => {
      const state: AppUIState = { screen: 'CELEBRATING', pendingAmount: 1800, pendingLabel: 'Amazon' };
      const next = uiReducer(state, { type: 'CELEBRATION_COMPLETE' });
      expect(next.pendingAmount).toBe(1800);
    });
  });

  // DISMISS
  describe('DISMISS', () => {
    it('transitions TRANSFER_PROMPT → IDLE', () => {
      const state: AppUIState = { screen: 'TRANSFER_PROMPT', pendingAmount: 500, pendingLabel: 'Test' };
      const next = uiReducer(state, { type: 'DISMISS' });
      expect(next.screen).toBe('IDLE');
    });

    it('resets pendingAmount to 0', () => {
      const state: AppUIState = { screen: 'TRANSFER_PROMPT', pendingAmount: 999, pendingLabel: 'Test' };
      const next = uiReducer(state, { type: 'DISMISS' });
      expect(next.pendingAmount).toBe(0);
    });

    it('resets pendingLabel to empty string', () => {
      const state: AppUIState = { screen: 'TRANSFER_PROMPT', pendingAmount: 999, pendingLabel: 'Test' };
      const next = uiReducer(state, { type: 'DISMISS' });
      expect(next.pendingLabel).toBe('');
    });

    it('can dismiss from IDLE (no-op transition)', () => {
      const next = uiReducer(idle, { type: 'DISMISS' });
      expect(next.screen).toBe('IDLE');
    });
  });

  // MARK_TRANSFERRED
  describe('MARK_TRANSFERRED', () => {
    it('behaves identically to DISMISS — returns IDLE with reset fields', () => {
      const state: AppUIState = { screen: 'TRANSFER_PROMPT', pendingAmount: 750, pendingLabel: 'Drinks' };
      const next = uiReducer(state, { type: 'MARK_TRANSFERRED' });
      expect(next.screen).toBe('IDLE');
      expect(next.pendingAmount).toBe(0);
      expect(next.pendingLabel).toBe('');
    });
  });

  // INITIAL_UI
  describe('INITIAL_UI', () => {
    it('has screen IDLE', () => {
      expect(INITIAL_UI.screen).toBe('IDLE');
    });

    it('has pendingAmount 0', () => {
      expect(INITIAL_UI.pendingAmount).toBe(0);
    });

    it('has pendingLabel empty string', () => {
      expect(INITIAL_UI.pendingLabel).toBe('');
    });
  });

  // Full state machine flow
  describe('full state machine flow', () => {
    it('follows the complete happy path: IDLE → selecting → celebrating → transfer → idle', () => {
      let state = idle;
      state = uiReducer(state, { type: 'OPEN_SELECTOR' });
      expect(state.screen).toBe('SELECTING_AMOUNT');

      state = uiReducer(state, { type: 'CONFIRM_DEPOSIT', amount: 600, label: 'Coffee' });
      expect(state.screen).toBe('CELEBRATING');
      expect(state.pendingAmount).toBe(600);

      state = uiReducer(state, { type: 'CELEBRATION_COMPLETE' });
      expect(state.screen).toBe('TRANSFER_PROMPT');

      state = uiReducer(state, { type: 'DISMISS' });
      expect(state.screen).toBe('IDLE');
      expect(state.pendingAmount).toBe(0);
    });
  });
});
