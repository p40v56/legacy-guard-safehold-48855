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
  const clean = value.replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

/** Strip formatting to get a raw number string */
export function stripFormatting(value: string): string {
  return value.replace(/,/g, '');
}

// ─── FX Rates ───

export interface FxRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

const FX_CACHE_KEY = 'lv_fx_rates';
const FX_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

/** Fetch latest FX rates from a free API, with local cache */
export async function fetchFxRates(baseCurrency: string = 'USD'): Promise<FxRates> {
  // Check cache
  try {
    const cached = localStorage.getItem(FX_CACHE_KEY);
    if (cached) {
      const parsed: FxRates = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < FX_CACHE_TTL) {
        return parsed;
      }
    }
  } catch { /* ignore */ }

  try {
    // Use the free frankfurter.app API (no key needed, ECB rates)
    const symbols = CURRENCIES.map(c => c.code).join(',');
    const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${symbols}`);
    if (!res.ok) throw new Error('FX fetch failed');
    const data = await res.json();
    const fxRates: FxRates = {
      base: data.base,
      rates: { ...data.rates, [data.base]: 1 },
      timestamp: Date.now(),
    };
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(fxRates));
    return fxRates;
  } catch {
    // Fallback: return identity rates so the app doesn't break
    const fallback: FxRates = {
      base: baseCurrency,
      rates: Object.fromEntries(CURRENCIES.map(c => [c.code, 1])),
      timestamp: Date.now(),
    };
    return fallback;
  }
}

/** Convert an amount from one currency to another using fetched rates.
 *  Rates are relative to a common base (USD from frankfurter). */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: FxRates
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates.rates[fromCurrency];
  const toRate = rates.rates[toCurrency];
  if (!fromRate || !toRate) return amount; // no rate available, return as-is
  // Convert: amount in FROM → base → TO
  // If base is USD: 1 USD = fromRate FROM, 1 USD = toRate TO
  // amount FROM / fromRate = amount in base; * toRate = amount in TO
  return (amount / fromRate) * toRate;
}

/** Get the currency code for a financial asset from its category_specific_fields */
export function getAssetCurrency(csf: Record<string, any> | null | undefined): string {
  return (csf as any)?.currency || DEFAULT_CURRENCY;
}
