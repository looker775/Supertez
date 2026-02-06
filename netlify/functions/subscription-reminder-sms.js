const SMS_API_BASE = 'https://api.twilio.com/2010-04-01';

const corsHeaders = {
  'Content-Type': 'application/json',
};

function normalizePhone(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/\D/g, '')}`;
}

async function sendSms({ accountSid, authToken, from, to, body }) {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`${SMS_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'SMS failed');
  }
}

exports.handler = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!accountSid || !authToken || !fromNumber || !supabaseUrl || !supabaseService) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing SMS or Supabase config' }),
    };
  }

  const reminderDays = Number(process.env.SMS_REMINDER_DAYS || 3);
  const now = new Date();
  const future = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  const query = new URL(`${supabaseUrl}/rest/v1/driver_subscriptions`);
  query.searchParams.set('select', 'driver_id,expires_at,status,is_free_access,profiles:profiles!driver_id(phone,full_name)');
  query.searchParams.set('expires_at', `gte.${now.toISOString()}`);
  query.searchParams.append('expires_at', `lt.${future.toISOString()}`);

  const response = await fetch(query.toString(), {
    headers: {
      apikey: supabaseService,
      Authorization: `Bearer ${supabaseService}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify({ error: errorText }),
    };
  }

  const subs = await response.json();
  let sent = 0;

  for (const sub of subs) {
    const phone = normalizePhone(sub?.profiles?.phone);
    if (!phone) continue;

    const name = sub?.profiles?.full_name || 'Driver';
    const expiresAt = sub?.expires_at ? new Date(sub.expires_at) : null;
    const expiresLabel = expiresAt ? expiresAt.toLocaleDateString('en-US') : 'soon';

    const body = `Hi ${name}, your Supertez subscription expires on ${expiresLabel}. Please renew to keep receiving ride requests.`;

    try {
      await sendSms({
        accountSid,
        authToken,
        from: fromNumber,
        to: phone,
        body,
      });
      sent += 1;
    } catch {
      // ignore individual failures
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok: true, sent, total: subs.length }),
  };
};

exports.config = {
  schedule: '0 9 * * *',
};
