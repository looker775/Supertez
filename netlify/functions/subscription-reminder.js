const RESEND_API_BASE = 'https://api.resend.com';

const corsHeaders = {
  'Content-Type': 'application/json',
};

exports.handler = async () => {
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!resendKey || !emailFrom || !supabaseUrl || !supabaseService) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing email or Supabase config' }),
    };
  }

  const reminderDays = Number(process.env.SUBSCRIPTION_REMINDER_DAYS || 3);
  const now = new Date();
  const future = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  const query = new URL(`${supabaseUrl}/rest/v1/driver_subscriptions`);
  query.searchParams.set('select', 'driver_id,expires_at,status,is_free_access,profiles:profiles!driver_id(email,full_name)');
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
    const email = sub?.profiles?.email;
    if (!email) continue;

    const name = sub?.profiles?.full_name || 'Driver';
    const expiresAt = sub?.expires_at ? new Date(sub.expires_at) : null;
    const expiresLabel = expiresAt ? expiresAt.toLocaleDateString('en-US') : 'soon';

    const subject = 'Your Supertez subscription is expiring soon';
    const text = [
      `Hi ${name},`,
      '',
      `Your driver subscription is expiring on ${expiresLabel}.`,
      'Please renew to keep receiving ride requests.',
      '',
      'Thank you for using Supertez.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Your Supertez subscription is expiring soon</h2>
        <p>Hi ${name},</p>
        <p>Your driver subscription is expiring on <strong>${expiresLabel}</strong>.</p>
        <p>Please renew to keep receiving ride requests.</p>
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
        to: email,
        subject,
        text,
        html,
      }),
    });

    if (emailResponse.ok) sent += 1;
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
