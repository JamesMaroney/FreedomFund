import { describe, it, expect } from 'vitest';
import { formatCents, parseDollarsToCents } from './currency';

const USD = { locale: 'en-US', currency: 'USD' };
const EUR_DE = { locale: 'de-DE', currency: 'EUR' };
const JPY = { locale: 'ja-JP', currency: 'JPY' };
const GBP = { locale: 'en-GB', currency: 'GBP' };

// ─── formatCents ─────────────────────────────────────────────────────────────

describe('formatCents', () => {
  // Basic USD
  it('formats whole dollars without decimal part (en-US)', () => {
    expect(formatCents(500, USD)).toBe('$5');
  });

  it('formats cents with two decimal places (en-US)', () => {
    expect(formatCents(550, USD)).toBe('$5.50');
  });

  it('formats zero as $0 (en-US)', () => {
    expect(formatCents(0, USD)).toBe('$0');
  });

  it('formats large amount correctly (en-US)', () => {
    expect(formatCents(100000, USD)).toBe('$1,000');
  });

  it('formats $1,000.50 correctly (en-US)', () => {
    expect(formatCents(100050, USD)).toBe('$1,000.50');
  });

  // German Euro
  it('formats Euro with German locale', () => {
    const result = formatCents(2550, EUR_DE);
    // de-DE uses comma as decimal sep; should include € and 25,50
    expect(result).toContain('€');
    expect(result).toContain('25');
  });

  // Japanese Yen (no decimal places)
  it('formats Japanese Yen without decimal places', () => {
    const result = formatCents(500, JPY);
    // 500 cents = 5 units; JPY Intl formatter should not include decimals
    expect(result).toMatch(/5/);
    expect(result).not.toMatch(/\./);
  });

  // GBP
  it('formats British Pounds correctly', () => {
    const result = formatCents(1099, GBP);
    expect(result).toContain('£');
    expect(result).toContain('10.99');
  });

  // Fallback
  it('uses USD as default when no locale provided', () => {
    expect(formatCents(1000)).toBe('$10');
  });

  it('falls back gracefully for an invalid locale/currency', () => {
    const bad = { locale: 'xx-XX', currency: 'ZZZ' };
    const result = formatCents(1000, bad);
    // Fallback returns $-prefixed string
    expect(result).toContain('10');
  });
});

// ─── parseDollarsToCents ─────────────────────────────────────────────────────

describe('parseDollarsToCents', () => {
  it('parses integer dollar string', () => {
    expect(parseDollarsToCents('10')).toBe(1000);
  });

  it('parses decimal dollar string', () => {
    expect(parseDollarsToCents('10.50')).toBe(1050);
  });

  it('parses string with only cents', () => {
    expect(parseDollarsToCents('0.99')).toBe(99);
  });

  it('rounds half-cent correctly', () => {
    expect(parseDollarsToCents('0.005')).toBe(1);
  });

  it('strips currency symbols before parsing', () => {
    expect(parseDollarsToCents('$5.00')).toBe(500);
  });

  it('strips commas from formatted strings', () => {
    expect(parseDollarsToCents('1,000.00')).toBe(100000);
  });

  it('returns 0 for empty string', () => {
    expect(parseDollarsToCents('')).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseDollarsToCents('abc')).toBe(0);
  });

  it('handles zero', () => {
    expect(parseDollarsToCents('0')).toBe(0);
  });
});
