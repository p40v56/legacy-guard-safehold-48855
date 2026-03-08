export const CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
  { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'de-DE' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF', locale: 'de-CH' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)', locale: 'en-AU' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
  { code: 'CNY', symbol: '¥', label: 'CNY (¥)', locale: 'zh-CN' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

export function getCurrency(code?: string | null) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function formatCurrencyValue(value: number, currencyCode?: string | null): string {
  const cur = getCurrency(currencyCode);
  return new Intl.NumberFormat(cur.locale, {
    style: 'currency',
    currency: cur.code,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a raw numeric string with thousand separators for display in an input */
export function formatNumberWithSeparators(value: string): string {
  // Strip everything except digits and decimal point
  const clean = value.replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

/** Strip formatting to get a raw number string */
export function stripFormatting(value: string): string {
  return value.replace(/,/g, '');
}
