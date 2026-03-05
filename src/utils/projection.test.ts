import { describe, it, expect } from 'vitest';
import { futureValue, calcProjections } from './projection';

// ─── futureValue ──────────────────────────────────────────────────────────────

describe('futureValue', () => {
  it('computes FV correctly: $100 at 7% for 10 years', () => {
    // FV = 10000 * (1.07)^10 = 19671.51 → rounds to 19672
    const result = futureValue(10000, 7, 10);
    expect(result).toBe(19672);
  });

  it('computes FV correctly: $1000 at 10% for 1 year', () => {
    // FV = 100000 * 1.10 = 110000
    expect(futureValue(100000, 10, 1)).toBe(110000);
  });

  it('returns the principal when rate is 0%', () => {
    expect(futureValue(5000, 0, 20)).toBe(5000);
  });

  it('returns the principal when years is 0', () => {
    expect(futureValue(5000, 7, 0)).toBe(5000);
  });

  it('returns the principal (unchanged) when presentValue is 0', () => {
    expect(futureValue(0, 7, 10)).toBe(0);
  });

  it('returns presentValue when it is negative (guard branch)', () => {
    expect(futureValue(-100, 7, 10)).toBe(-100);
  });

  it('handles very small amounts without floating-point drift', () => {
    // 1 cent at 7% for 1 year = round(1 * 1.07) = 1
    expect(futureValue(1, 7, 1)).toBe(1);
  });

  it('handles large amounts correctly', () => {
    // $500k at 7% for 30 years
    const result = futureValue(50000000, 7, 30);
    expect(result).toBeGreaterThan(50000000);
    // Rough sanity: ~$3.8M
    expect(result).toBeGreaterThan(300000000);
  });
});

// ─── calcProjections ─────────────────────────────────────────────────────────

describe('calcProjections', () => {
  it('returns a tuple of three projections with correct years', () => {
    const result = calcProjections(10000, 7, [10, 20, 30]);
    expect(result).toHaveLength(3);
    expect(result[0].years).toBe(10);
    expect(result[1].years).toBe(20);
    expect(result[2].years).toBe(30);
  });

  it('valueCents increases with each horizon', () => {
    const result = calcProjections(10000, 7, [10, 20, 30]);
    expect(result[0].valueCents).toBeLessThan(result[1].valueCents);
    expect(result[1].valueCents).toBeLessThan(result[2].valueCents);
  });

  it('each valueCents matches futureValue individually', () => {
    const pv = 25000;
    const rate = 8;
    const horizons: [number, number, number] = [5, 15, 25];
    const result = calcProjections(pv, rate, horizons);
    expect(result[0].valueCents).toBe(futureValue(pv, rate, 5));
    expect(result[1].valueCents).toBe(futureValue(pv, rate, 15));
    expect(result[2].valueCents).toBe(futureValue(pv, rate, 25));
  });

  it('returns principal unchanged for 0% rate', () => {
    const result = calcProjections(10000, 0, [10, 20, 30]);
    expect(result.every((p) => p.valueCents === 10000)).toBe(true);
  });

  it('works with asymmetric horizons', () => {
    const result = calcProjections(1000, 5, [1, 2, 3]);
    expect(result[0].years).toBe(1);
    expect(result[2].years).toBe(3);
    expect(result[2].valueCents).toBeGreaterThan(result[0].valueCents);
  });
});
