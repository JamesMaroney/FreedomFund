export interface CurrencyLocale {
  locale: string;   // BCP 47 locale tag, e.g. "en-US", "de-DE"
  currency: string; // ISO 4217 currency code, e.g. "USD", "EUR"
}

/** Best-effort detection of the user's system locale and likely currency. */
export function detectSystemLocale(): CurrencyLocale {
  const locale = navigator.language || 'en-US';

  // Map locale region to a common currency code.
  const region = locale.split('-')[1]?.toUpperCase();
  const REGION_CURRENCY: Record<string, string> = {
    US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR',
    ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR',
    IE: 'EUR', GR: 'EUR', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY',
    CN: 'CNY', IN: 'INR', BR: 'BRL', MX: 'MXN', KR: 'KRW', SG: 'SGD',
    HK: 'HKD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
    CZ: 'CZK', HU: 'HUF', RU: 'RUB', ZA: 'ZAR', TR: 'TRY', TH: 'THB',
    MY: 'MYR', ID: 'IDR', PH: 'PHP', PK: 'PKR', NG: 'NGN', AR: 'ARS',
    CL: 'CLP', CO: 'COP', IL: 'ILS', SA: 'SAR', AE: 'AED', EG: 'EGP',
  };
  const currency = (region && REGION_CURRENCY[region]) ?? 'USD';

  return { locale, currency };
}

/** Format cents as a locale-aware currency string: 2550 → "$25.50" (en-US/USD) */
export function formatCents(cents: number, loc?: CurrencyLocale): string {
  const { locale, currency } = loc ?? { locale: 'en-US', currency: 'USD' };
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch {
    // Fallback if locale/currency is invalid
    return '$' + dollars.toFixed(2).replace(/\.00$/, '');
  }
}

/** Format cents compactly — whole dollars omit fractional part. */
export function formatCentsCompact(cents: number, loc?: CurrencyLocale): string {
  return formatCents(cents, loc);
}

/** Parse a dollar string like "12.50" or "12" into cents (locale-agnostic, numeric input) */
export function parseDollarsToCents(value: string): number {
  // Strip any non-numeric except dot and minus, to handle locale-formatted pastes
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Known popular locale+currency combinations for the settings picker. */
export const CURRENCY_LOCALES: { label: string; locale: string; currency: string }[] = [
  { label: 'USD — US Dollar',          locale: 'en-US', currency: 'USD' },
  { label: 'EUR — Euro (DE)',           locale: 'de-DE', currency: 'EUR' },
  { label: 'EUR — Euro (FR)',           locale: 'fr-FR', currency: 'EUR' },
  { label: 'GBP — British Pound',       locale: 'en-GB', currency: 'GBP' },
  { label: 'CAD — Canadian Dollar',     locale: 'en-CA', currency: 'CAD' },
  { label: 'AUD — Australian Dollar',   locale: 'en-AU', currency: 'AUD' },
  { label: 'NZD — New Zealand Dollar',  locale: 'en-NZ', currency: 'NZD' },
  { label: 'CHF — Swiss Franc',         locale: 'de-CH', currency: 'CHF' },
  { label: 'JPY — Japanese Yen',        locale: 'ja-JP', currency: 'JPY' },
  { label: 'CNY — Chinese Yuan',        locale: 'zh-CN', currency: 'CNY' },
  { label: 'INR — Indian Rupee',        locale: 'en-IN', currency: 'INR' },
  { label: 'BRL — Brazilian Real',      locale: 'pt-BR', currency: 'BRL' },
  { label: 'MXN — Mexican Peso',        locale: 'es-MX', currency: 'MXN' },
  { label: 'KRW — South Korean Won',    locale: 'ko-KR', currency: 'KRW' },
  { label: 'SEK — Swedish Krona',       locale: 'sv-SE', currency: 'SEK' },
  { label: 'NOK — Norwegian Krone',     locale: 'nb-NO', currency: 'NOK' },
  { label: 'DKK — Danish Krone',        locale: 'da-DK', currency: 'DKK' },
  { label: 'SGD — Singapore Dollar',    locale: 'en-SG', currency: 'SGD' },
  { label: 'HKD — Hong Kong Dollar',    locale: 'zh-HK', currency: 'HKD' },
  { label: 'ZAR — South African Rand',  locale: 'en-ZA', currency: 'ZAR' },
];
