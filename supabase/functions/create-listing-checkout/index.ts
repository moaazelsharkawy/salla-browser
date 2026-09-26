import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, '');
}

const configuredOrigin = normalizeOrigin(Deno.env.get('SALLA_BROWSER_ORIGIN') || 'https://browser.salla-shop.com');

function corsHeaders(req: Request) {
  const requestOrigin = normalizeOrigin(req.headers.get('Origin') || '');
  const allowedOrigin = requestOrigin === configuredOrigin ? requestOrigin : configuredOrigin;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function isValidCheckoutUrl(value: unknown) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'mall.salla-shop.com' && url.pathname.startsWith('/api-checkout/');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { success: false, error: 'method_not_allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const sallaApiKey = Deno.env.get('SALLA_SHOP_API_KEY') || '';
    const browserOrigin = configuredOrigin;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error('[listing-checkout] server configuration is incomplete');
      return json(req, { success: false, error: 'service_unavailable' }, 503);
    }
    if (!sallaApiKey) {
      console.error('[listing-checkout] SALLA_SHOP_API_KEY is missing');
      return json(req, { success: false, error: 'payment_setup_incomplete' }, 503);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json(req, { success: false, error: 'unauthorized' }, 401);

    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) return json(req, { success: false, error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const submissionId = typeof body?.submission_id === 'string' ? body.submission_id : '';
    if (!submissionId) return json(req, { success: false, error: 'missing_submission' }, 400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: submission, error: submissionError } = await admin
      .from('app_submissions')
      .select('id,user_id,app_name,submission_type,payment_status,listing_price,payment_currency,payment_transaction_id,payment_checkout_url')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (submissionError || !submission) return json(req, { success: false, error: 'submission_not_found' }, 404);
    if (submission.submission_type !== 'new') return json(req, { success: false, error: 'payment_not_required' }, 400);
    if (submission.payment_status === 'paid' || submission.payment_status === 'not_required') return json(req, { success: false, error: 'payment_already_completed' }, 409);
    if (submission.payment_status !== 'awaiting_payment') return json(req, { success: false, error: 'payment_unavailable' }, 409);

    if (submission.payment_checkout_url && submission.payment_transaction_id && isValidCheckoutUrl(submission.payment_checkout_url)) {
      return json(req, {
        success: true,
        transaction_id: submission.payment_transaction_id,
        checkout_url: submission.payment_checkout_url,
        reused: true,
      });
    }

    if (submission.payment_checkout_url || submission.payment_transaction_id) {
      await admin.from('app_submissions').update({ payment_transaction_id: null, payment_checkout_url: null }).eq('id', submission.id);
    }

    const amount = Number(submission.listing_price || 0);
    if (!(amount > 0)) return json(req, { success: false, error: 'invalid_amount' }, 400);

    const providerResponse = await fetch('https://iagohfijczwnuihedsml.supabase.co/functions/v1/extapi-create-checkout', {
      method: 'POST',
      headers: {
        'X-API-Key': sallaApiKey,
        'Content-Type': 'application/json',
        'Origin': browserOrigin,
      },
      body: JSON.stringify({
        amount,
        currency: 'pi',
        description: `Salla Browser listing ${submission.app_name}`,
        success_url: `${browserOrigin}/my-submissions?payment=success&submission=${encodeURIComponent(submission.id)}`,
        cancel_url: `${browserOrigin}/my-submissions?payment=cancelled&submission=${encodeURIComponent(submission.id)}`,
      }),
    });

    const providerBody = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok || !providerBody?.success || !providerBody?.transaction_id || !isValidCheckoutUrl(providerBody?.checkout_url)) {
      console.error('[listing-checkout] provider rejected checkout', {
        status: providerResponse.status,
        success: providerBody?.success,
        hasTransactionId: Boolean(providerBody?.transaction_id),
        hasCheckoutUrl: Boolean(providerBody?.checkout_url),
        providerError: providerBody?.error || providerBody?.message || null,
      });
      return json(req, { success: false, error: providerResponse.ok ? 'checkout_invalid_url' : 'provider_rejected' }, 502);
    }

    const { error: updateError } = await admin.from('app_submissions').update({
      payment_transaction_id: String(providerBody.transaction_id),
      payment_checkout_url: String(providerBody.checkout_url),
      payment_started_at: new Date().toISOString(),
      payment_status: 'awaiting_payment',
    }).eq('id', submission.id).eq('user_id', user.id);

    if (updateError) {
      console.error('[listing-checkout] could not save checkout reference', updateError);
      return json(req, { success: false, error: 'checkout_save_failed' }, 500);
    }

    return json(req, {
      success: true,
      transaction_id: providerBody.transaction_id,
      checkout_url: providerBody.checkout_url,
      reused: false,
    });
  } catch (error) {
    console.error('[listing-checkout] unexpected error', error);
    return json(req, { success: false, error: 'service_unavailable' }, 500);
  }
});
