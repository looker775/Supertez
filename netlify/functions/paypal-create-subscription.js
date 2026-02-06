const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const DEFAULT_API_BASE = 'https://api-m.sandbox.paypal.com';
const FX_API_BASE = 'https://open.er-api.com/v6/latest';

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

async function getAccessToken(apiBase, clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error_description || 'Failed to get PayPal access token');
  }
  return data.access_token;
}

async function loadAppSettings() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return {};

  const response = await fetch(
    `${url}/rest/v1/app_settings?select=driver_subscription_price,subscription_period_days,subscription_currency,currency,paypal_plan_id&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) return {};
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : {};
}

function normalizeCurrency(code, fallback) {
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (normalized && PAYPAL_SUPPORTED_CURRENCIES.has(normalized)) return normalized;
  const fallbackNormalized = typeof fallback === 'string' ? fallback.trim().toUpperCase() : '';
  if (fallbackNormalized && PAYPAL_SUPPORTED_CURRENCIES.has(fallbackNormalized)) return fallbackNormalized;
  return 'USD';
}

function roundAmount(amount, currency) {
  if (!Number.isFinite(amount)) return amount;
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

async function fetchCountryCurrency(countryCode) {
  if (!countryCode) return undefined;
  const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`);
  if (!response.ok) return undefined;
  const data = await response.json();
  const entry = Array.isArray(data) ? data[0] : data;
  const currencies = entry?.currencies;
  if (!currencies || typeof currencies !== 'object') return undefined;
  const codes = Object.keys(currencies);
  return codes[0];
}

async function resolveCurrencyForCountry(countryCode, baseCurrency) {
  const raw = await fetchCountryCurrency(countryCode);
  const normalized = normalizeCurrency(raw, baseCurrency);
  const isFallback = !raw || normalized !== raw.toUpperCase();
  return { currency: normalized, raw, isFallback };
}

async function fetchExchangeRate(baseCurrency, targetCurrency) {
  if (baseCurrency === targetCurrency) return 1;
  const response = await fetch(`${FX_API_BASE}/${baseCurrency}`);
  if (!response.ok) return undefined;
  const data = await response.json();
  if (data?.result !== 'success' || !data?.rates) return undefined;
  const rate = data.rates[targetCurrency];
  return typeof rate === 'number' ? rate : undefined;
}

async function createPlan(apiBase, token, productId, price, days, currency) {
  const response = await fetch(`${apiBase}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: `Driver Subscription ${price} ${currency}`,
      description: 'Driver subscription plan',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'DAY',
            interval_count: days,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 1,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to create PayPal plan');
  }

  return data.id;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_API_BASE || DEFAULT_API_BASE;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing PayPal credentials' }),
    };
  }

  try {
    const settings = await loadAppSettings();
    const token = await getAccessToken(apiBase, clientId, clientSecret);

    const basePriceValue = Number(settings.driver_subscription_price ?? 2);
    const basePrice = Number.isFinite(basePriceValue) ? basePriceValue : 2;
    const daysValue = Number(settings.subscription_period_days ?? 30);
    const days = Number.isFinite(daysValue) && daysValue > 0 ? Math.round(daysValue) : 30;
    const currencyRaw = settings.subscription_currency || settings.currency || 'USD';
    const baseCurrency = String(currencyRaw).toUpperCase();

    const countryCode = payload.countryCode ? String(payload.countryCode).toUpperCase() : undefined;
    const resolved = await resolveCurrencyForCountry(countryCode, baseCurrency);
    let currency = resolved.currency;

    let rate = await fetchExchangeRate(baseCurrency, currency);
    if (!rate) {
      currency = normalizeCurrency(baseCurrency);
      rate = await fetchExchangeRate(baseCurrency, currency);
    }

    const convertedPrice = roundAmount(basePrice * (rate || 1), currency);
    const price = Number.isFinite(convertedPrice) ? convertedPrice : basePrice;

    let planId = payload.planId || process.env.PAYPAL_PLAN_ID;
    if (!planId && settings.paypal_plan_id && currency === normalizeCurrency(baseCurrency)) {
      planId = settings.paypal_plan_id;
    }

    if (!planId) {
      const productId = process.env.PAYPAL_PRODUCT_ID;
      if (!productId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing PAYPAL_PLAN_ID or PAYPAL_PRODUCT_ID' }),
        };
      }

      planId = await createPlan(apiBase, token, productId, price, days, currency);
    }

    const siteUrl = process.env.URL || process.env.SITE_URL;
    const returnUrl = payload.returnUrl || (siteUrl ? `${siteUrl}/subscription?paypal=success` : undefined);
    const cancelUrl = payload.cancelUrl || (siteUrl ? `${siteUrl}/subscription?paypal=cancel` : undefined);

    const body = {
      plan_id: planId,
      custom_id: payload.customId,
      application_context: {
        brand_name: process.env.PAYPAL_BRAND_NAME || 'Supertez',
        user_action: 'SUBSCRIBE_NOW',
      },
    };

    if (returnUrl) body.application_context.return_url = returnUrl;
    if (cancelUrl) body.application_context.cancel_url = cancelUrl;

    const response = await fetch(`${apiBase}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: data?.message || 'Failed to create subscription' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Unexpected error' }),
    };
  }
};
