/**
 * Future value of a lump sum invested today.
 * FV = PV × (1 + r)^n
 */
export function futureValue(presentValueCents: number, annualRatePct: number, years: number): number {
  if (presentValueCents <= 0 || years <= 0) return presentValueCents;
  const r = annualRatePct / 100;
  return Math.round(presentValueCents * Math.pow(1 + r, years));
}

export interface Projection {
  years: number;
  valueCents: number;
}

export function calcProjections(
  totalSavedCents: number,
  annualRatePct: number,
  horizons: [number, number, number],
): [Projection, Projection, Projection] {
  return horizons.map((y) => ({
    years: y,
    valueCents: futureValue(totalSavedCents, annualRatePct, y),
  })) as [Projection, Projection, Projection];
}
