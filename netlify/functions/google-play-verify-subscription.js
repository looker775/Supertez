const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(header, payload, privateKey) {
  const { createSign } = require('crypto');
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(privateKey, 'base64');
  return `${unsignedToken}.${signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}

function parseServiceAccount() {
  const raw =
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    '';

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

async function getGoogleAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: serviceAccount.token_uri || GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const jwt = signJwt(header, payload, serviceAccount.private_key);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });

  const response = await fetch(serviceAccount.token_uri || GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'Failed to get Google access token');
  }
  return data.access_token;
}

async function getSupabaseUser(supabaseUrl, anonKey, userToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
      apikey: anonKey,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchGoogleSubscription(accessToken, packageName, productId, purchaseToken) {
  const url = `${GOOGLE_PLAY_API}/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to verify Google Play subscription');
  }
  return data;
}

async function upsertDriverSubscription(supabaseUrl, anonKey, userToken, driverId, payload) {
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/driver_subscriptions?driver_id=eq.${encodeURIComponent(driverId)}&select=id`,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
        apikey: anonKey,
      },
    }
  );
  const existing = existingRes.ok ? await existingRes.json() : [];

  const method = existing.length ? 'PATCH' : 'POST';
  const url = existing.length
    ? `${supabaseUrl}/rest/v1/driver_subscriptions?driver_id=eq.${encodeURIComponent(driverId)}`
    : `${supabaseUrl}/rest/v1/driver_subscriptions`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${userToken}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || error?.error || 'Failed to update subscription in Supabase');
  }

  return response.json().catch(() => []);
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

  const purchaseToken = payload.purchaseToken;
  const productId = payload.productId;
  const packageName = payload.packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME;
  const userToken = (event.headers.authorization || '').replace('Bearer ', '').trim();

  if (!purchaseToken || !productId || !packageName) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing purchaseToken, productId, or packageName' }),
    };
  }

  if (!userToken) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing user token' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceAccount = parseServiceAccount();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Missing Supabase env' }) };
  }
  if (!serviceAccount) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Missing Google service account' }) };
  }

  try {
    const user = await getSupabaseUser(supabaseUrl, supabaseAnonKey, userToken);
    if (!user?.id) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid user token' }) };
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const googleData = await fetchGoogleSubscription(accessToken, packageName, productId, purchaseToken);

    const expiryMs = Number(googleData.expiryTimeMillis || 0);
    const nowMs = Date.now();
    const isActive = expiryMs > nowMs;
    const status = isActive ? 'active' : 'expired';

    const updatePayload = {
      driver_id: user.id,
      status,
      expires_at: expiryMs ? new Date(expiryMs).toISOString() : null,
      auto_renew: Boolean(googleData.autoRenewing),
      is_free_access: false,
      payment_method: 'google_play',
      provider: 'google_play',
      provider_product_id: productId,
      provider_purchase_token: purchaseToken,
      provider_subscription_id: googleData.orderId || null,
      last_payment_amount: googleData.priceAmountMicros ? Number(googleData.priceAmountMicros) / 1_000_000 : null,
      last_payment_currency: googleData.priceCurrencyCode || null,
      last_payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await upsertDriverSubscription(supabaseUrl, supabaseAnonKey, userToken, user.id, updatePayload);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status,
        expires_at: updatePayload.expires_at,
        auto_renew: updatePayload.auto_renew,
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
