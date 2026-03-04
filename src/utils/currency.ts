/** Format cents as a display string: 2550 → "$25.50" */
export function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
}

/** Format cents compactly (no cents if whole dollar): 2500 → "$25", 2550 → "$25.50" */
export function formatCentsCompact(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) {
    return '$' + dollars.toString();
  }
  return '$' + dollars.toFixed(2);
}

/** Parse a dollar string like "12.50" or "12" into cents */
export function parseDollarsToCents(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
