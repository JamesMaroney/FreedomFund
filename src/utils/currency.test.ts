import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatCents, parseDollarsToCents, detectSystemLocale } from './currency';

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

  it('uses the catch fallback when Intl.NumberFormat throws', () => {
    const original = Intl.NumberFormat;
    vi.stubGlobal('Intl', {
      ...Intl,
      NumberFormat: function () {
        throw new RangeError('Invalid currency code');
      },
    });
    const result = formatCents(1050, { locale: 'en-US', currency: 'USD' });
    // catch block: '$' + dollars.toFixed(2).replace(/\.00$/, '')
    expect(result).toBe('$10.50');
    vi.stubGlobal('Intl', { ...Intl, NumberFormat: original });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

// ─── detectSystemLocale ───────────────────────────────────────────────────────

describe('detectSystemLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns USD for en-US navigator language', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    const result = detectSystemLocale();
    expect(result.locale).toBe('en-US');
    expect(result.currency).toBe('USD');
  });

  it('returns GBP for en-GB navigator language', () => {
    vi.stubGlobal('navigator', { language: 'en-GB' });
    const result = detectSystemLocale();
    expect(result.locale).toBe('en-GB');
    expect(result.currency).toBe('GBP');
  });

  it('returns EUR for de-DE navigator language', () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    const result = detectSystemLocale();
    expect(result.locale).toBe('de-DE');
    expect(result.currency).toBe('EUR');
  });

  it('returns JPY for ja-JP navigator language', () => {
    vi.stubGlobal('navigator', { language: 'ja-JP' });
    const result = detectSystemLocale();
    expect(result.currency).toBe('JPY');
  });

  it('falls back to USD for an unknown region', () => {
    vi.stubGlobal('navigator', { language: 'en-XX' });
    const result = detectSystemLocale();
    expect(result.currency).toBe('USD');
  });

  it('falls back to USD when navigator language has no region tag', () => {
    // e.g. "fr" with no "-XX" region — region will be undefined → ?? 'USD'
    vi.stubGlobal('navigator', { language: 'fr' });
    const result = detectSystemLocale();
    expect(result.locale).toBe('fr');
    expect(result.currency).toBe('USD');
  });

  it('falls back to en-US locale when navigator.language is falsy', () => {
    vi.stubGlobal('navigator', { language: '' });
    const result = detectSystemLocale();
    expect(result.locale).toBe('en-US');
  });
});
