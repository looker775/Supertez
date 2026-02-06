const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  'AUD',
  'BRL',
  'CAD',
  'CZK',
  'DKK',
  'EUR',
  'HKD',
  'HUF',
  'ILS',
  'JPY',
  'MYR',
  'MXN',
  'TWD',
  'NZD',
  'NOK',
  'PHP',
  'PLN',
  'GBP',
  'RUB',
  'SGD',
  'SEK',
  'CHF',
  'THB',
  'USD',
]);

const ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'TWD']);

const COUNTRY_CACHE_KEY = 'country_currency_cache_v1';
const RATE_CACHE_KEY = 'fx_rate_cache_v1';
const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type CurrencyCache = Record<string, { currency: string; updatedAt: number }>;
type RateCache = Record<string, { rates: Record<string, number>; updatedAt: number }>;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function normalizeCurrency(code?: string, fallback?: string) {
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (normalized && PAYPAL_SUPPORTED_CURRENCIES.has(normalized)) return normalized;
  const fallbackNormalized = typeof fallback === 'string' ? fallback.trim().toUpperCase() : '';
  if (fallbackNormalized && PAYPAL_SUPPORTED_CURRENCIES.has(fallbackNormalized)) return fallbackNormalized;
  return 'USD';
}

export function roundAmount(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return amount;
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

export function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

async function fetchCountryCurrency(countryCode: string): Promise<string | undefined> {
  const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`);
  if (!response.ok) return undefined;
  const data = await response.json();
  const entry = Array.isArray(data) ? data[0] : data;
  const currencies = entry?.currencies;
  if (!currencies || typeof currencies !== 'object') return undefined;
  const codes = Object.keys(currencies);
  return codes[0];
}

export async function getCurrencyForCountry(countryCode?: string, fallback?: string) {
  if (!countryCode) return normalizeCurrency(undefined, fallback);
  const code = countryCode.toUpperCase();

  const cache = readCache<CurrencyCache>(COUNTRY_CACHE_KEY) || {};
  const cached = cache[code];
  if (cached?.currency) {
    return normalizeCurrency(cached.currency, fallback);
  }

  try {
    const currency = await fetchCountryCurrency(code);
    if (currency) {
      cache[code] = { currency, updatedAt: Date.now() };
      writeCache(COUNTRY_CACHE_KEY, cache);
      return normalizeCurrency(currency, fallback);
    }
  } catch {
    // ignore
  }

  return normalizeCurrency(undefined, fallback);
}

export async function resolveCurrencyForCountry(countryCode?: string, fallback?: string) {
  if (!countryCode) {
    return { currency: normalizeCurrency(undefined, fallback), raw: undefined, isFallback: true };
  }
  const code = countryCode.toUpperCase();
  let rawCurrency: string | undefined;

  const cache = readCache<CurrencyCache>(COUNTRY_CACHE_KEY) || {};
  const cached = cache[code];
  if (cached?.currency) {
    rawCurrency = cached.currency;
  } else {
    try {
      rawCurrency = await fetchCountryCurrency(code);
      if (rawCurrency) {
        cache[code] = { currency: rawCurrency, updatedAt: Date.now() };
        writeCache(COUNTRY_CACHE_KEY, cache);
      }
    } catch {
      rawCurrency = undefined;
    }
  }

  const normalized = normalizeCurrency(rawCurrency, fallback);
  const isFallback = !rawCurrency || normalized !== rawCurrency.toUpperCase();
  return { currency: normalized, raw: rawCurrency, isFallback };
}

async function fetchRates(baseCurrency: string): Promise<Record<string, number> | null> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
  if (!response.ok) return null;
  const data = await response.json();
  if (data?.result !== 'success' || !data?.rates) return null;
  return data.rates as Record<string, number>;
}

export async function getExchangeRate(baseCurrency: string, targetCurrency: string) {
  const base = baseCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();
  if (base === target) return 1;

  const cache = readCache<RateCache>(RATE_CACHE_KEY) || {};
  const cached = cache[base];
  if (cached && Date.now() - cached.updatedAt < RATE_CACHE_TTL_MS) {
    const rate = cached.rates?.[target];
    if (typeof rate === 'number') return rate;
  }

  try {
    const rates = await fetchRates(base);
    if (!rates) return undefined;
    cache[base] = { rates, updatedAt: Date.now() };
    writeCache(RATE_CACHE_KEY, cache);
    const rate = rates[target];
    return typeof rate === 'number' ? rate : undefined;
  } catch {
    return undefined;
  }
}

export function isPayPalCurrencySupported(code?: string) {
  if (!code) return false;
  return PAYPAL_SUPPORTED_CURRENCIES.has(code.toUpperCase());
}
