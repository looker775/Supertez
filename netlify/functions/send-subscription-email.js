const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const RESEND_API_BASE = 'https://api.resend.com';

async function getSupabaseUser(supabaseUrl, anonKey, token) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) return null;
  return response.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY;

  if (!resendKey || !emailFrom) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Email not configured' }),
    };
  }

  if (!supabaseUrl || !supabaseAnon) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing Supabase config' }),
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace(/^Bearer\s+/i, '')
    : '';

  if (!token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing auth token' }) };
  }

  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const user = await getSupabaseUser(supabaseUrl, supabaseAnon, token);
    const to = user?.email;
    const name = user?.user_metadata?.full_name || user?.email || 'Driver';

    if (!to) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid user' }) };
    }

    const price = payload.price ?? 2;
    const currency = payload.currency || 'USD';
    const days = payload.days ?? 30;
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    const expiresLabel = expiresAt ? expiresAt.toLocaleDateString('en-US') : 'N/A';

    const subject = 'Your Supertez subscription is active';
    const text = [
      `Hi ${name},`,
      '',
      'Your Supertez driver subscription is active.',
      `Amount: ${price} ${currency}`,
      `Period: ${days} days`,
      `Next renewal: ${expiresLabel}`,
      '',
      'Thank you for using Supertez.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Your Supertez subscription is active</h2>
        <p>Hi ${name},</p>
        <p>Your driver subscription is now active.</p>
        <ul>
          <li><strong>Amount:</strong> ${price} ${currency}</li>
          <li><strong>Period:</strong> ${days} days</li>
          <li><strong>Next renewal:</strong> ${expiresLabel}</li>
        </ul>
        <p>Thank you for using Supertez.</p>
      </div>
    `;

    const emailResponse = await fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        subject,
        text,
        html,
      }),
    });

    const emailData = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      return {
        statusCode: emailResponse.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: emailData?.message || 'Email send failed' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Unexpected error' }),
    };
  }
};
