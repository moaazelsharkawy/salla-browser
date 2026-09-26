import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://browser.salla-shop.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'method_not_allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const sallaApiKey = Deno.env.get('SALLA_SHOP_API_KEY') || '';
    const browserOrigin = Deno.env.get('SALLA_BROWSER_ORIGIN') || 'https://browser.salla-shop.com';
    if (!supabaseUrl || !anonKey || !serviceKey || !sallaApiKey) return json({ success: false, error: 'service_unavailable' }, 503);

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ success: false, error: 'unauthorized' }, 401);

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) return json({ success: false, error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const submissionId = typeof body?.submission_id === 'string' ? body.submission_id : '';
    if (!submissionId) return json({ success: false, error: 'missing_submission' }, 400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: submission, error: submissionError } = await admin
      .from('app_submissions')
      .select('id,user_id,app_name,submission_type,payment_status,listing_price,payment_currency,payment_transaction_id,payment_checkout_url')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (submissionError || !submission) return json({ success: false, error: 'submission_not_found' }, 404);
    if (submission.submission_type !== 'new') return json({ success: false, error: 'payment_not_required' }, 400);
    if (submission.payment_status === 'paid' || submission.payment_status === 'not_required') return json({ success: false, error: 'payment_already_completed' }, 409);
    if (submission.payment_status !== 'awaiting_payment') return json({ success: false, error: 'payment_unavailable' }, 409);

    if (submission.payment_checkout_url && submission.payment_transaction_id) {
      return json({ success: true, transaction_id: submission.payment_transaction_id, checkout_url: submission.payment_checkout_url, reused: true });
    }

    const amount = Number(submission.listing_price || 0);
    if (!(amount > 0)) return json({ success: false, error: 'invalid_amount' }, 400);

    const checkoutResponse = await fetch('https://iagohfijczwnuihedsml.supabase.co/functions/v1/extapi-create-checkout', {
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

    const checkout = await checkoutResponse.json().catch(() => ({}));
    if (!checkoutResponse.ok || !checkout?.success || !checkout?.transaction_id || !checkout?.checkout_url) {
      console.error('[listing-checkout] provider error', checkoutResponse.status, checkout);
      return json({ success: false, error: 'checkout_unavailable' }, 502);
    }

    const { error: updateError } = await admin.from('app_submissions').update({
      payment_transaction_id: String(checkout.transaction_id),
      payment_checkout_url: String(checkout.checkout_url),
      payment_started_at: new Date().toISOString(),
      payment_status: 'awaiting_payment',
    }).eq('id', submission.id).eq('user_id', user.id);

    if (updateError) {
      console.error('[listing-checkout] save error', updateError);
      return json({ success: false, error: 'checkout_save_failed' }, 500);
    }

    return json({ success: true, transaction_id: checkout.transaction_id, checkout_url: checkout.checkout_url });
  } catch (error) {
    console.error('[listing-checkout] unexpected error', error);
    return json({ success: false, error: 'service_unavailable' }, 500);
  }
});
