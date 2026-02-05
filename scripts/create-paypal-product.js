const DEFAULT_API_BASE = 'https://api-m.sandbox.paypal.com';

function getArgValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  return value || fallback;
}

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
    throw new Error(data?.error_description || 'Failed to get access token');
  }
  return data.access_token;
}

async function createProduct(apiBase, token, payload) {
  const response = await fetch(`${apiBase}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to create product');
  }
  return data;
}

async function main() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const apiBase = process.env.PAYPAL_API_BASE || DEFAULT_API_BASE;

  if (!clientId || !clientSecret) {
    console.error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment.');
    process.exit(1);
  }

  const name = getArgValue('--name', 'Supertez Driver Subscription');
  const description = getArgValue('--description', 'Driver monthly access');
  const category = getArgValue('--category', 'SOFTWARE');
  const type = getArgValue('--type', 'SERVICE');

  const token = await getAccessToken(apiBase, clientId, clientSecret);
  const product = await createProduct(apiBase, token, {
    name,
    description,
    type,
    category,
  });

  console.log('Product created successfully:');
  console.log(`ID: ${product.id}`);
  console.log(`Name: ${product.name}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
