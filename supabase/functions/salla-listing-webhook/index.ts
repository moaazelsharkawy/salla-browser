import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();
const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  let transactionId = '';
  let event = '';
  let status = '';
  let target = 'unknown';

  const fail = (reason: string, httpStatus: number, extra: Record<string, unknown> = {}) => {
    console.error('[SALLA-WEBHOOK:FAILED]', JSON.stringify({
      reason, http_status: httpStatus, transaction_id: transactionId || null, event: event || null, status: status || null,
      target, duration_ms: Date.now() - startedAt, ...extra
    }));
    return new Response(JSON.stringify({ success: false, error: reason }), { status: httpStatus, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    if (req.method !== 'POST') return fail('method_not_allowed', 405);

    const secret = Deno.env.get('SALLA_SHOP_WEBHOOK_SECRET') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!secret || !supabaseUrl || !serviceKey) return fail('service_unavailable', 503, { missing_configuration: true });

    const raw = await req.text();
    let body: any;
    try { body = JSON.parse(raw); } catch { return fail('invalid_json', 400); }

    const provided = (
      req.headers.get('x-signature') || req.headers.get('x-webhook-signature') ||
      req.headers.get('x-salla-signature') || req.headers.get('signature') || ''
    ).trim().replace(/^sha256=/i, '').toLowerCase();
    if (!provided) return fail('missing_signature', 401);

    const rawExpected = await hmacHex(secret, raw);
    const normalizedExpected = await hmacHex(secret, JSON.stringify(body));
    if (!safeEqual(provided, rawExpected) && !safeEqual(provided, normalizedExpected)) return fail('invalid_signature', 401);

    transactionId = String(body?.transaction_id || body?.data?.transaction_id || body?.transaction?.id || '').trim();
    if (!transactionId) return fail('missing_transaction', 400);

    status = String(body?.status || body?.data?.status || body?.transaction?.status || '').toLowerCase();
    event = String(body?.event || body?.type || '').toLowerCase();
    const isPaid = ['paid', 'completed', 'success', 'confirmed'].includes(status) || /payment.*(paid|complete|success|confirm)/.test(event);
    const isRefunded = ['refunded', 'refund'].includes(status) || /refund/.test(event);
    if (!isPaid && !isRefunded) {
      console.log('[SALLA-WEBHOOK:SUCCESS]', JSON.stringify({ transaction_id: transactionId, event: event || null, status: status || null, target: 'ignored', outcome: 'ignored_event', duration_ms: Date.now() - startedAt }));
      return new Response(JSON.stringify({ success: true, ignored: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: submission } = await admin.from('app_submissions').select('id,payment_status').eq('payment_transaction_id', transactionId).maybeSingle();
    if (submission) {
      target = 'listing';
      if (isPaid) {
        const { error } = await admin.from('app_submissions').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', submission.id);
        if (error) return fail('listing_update_failed', 500, { record_id: submission.id, database_error: error.message });
      } else {
        const refunded = Number(body?.amount || body?.data?.amount || body?.refund_amount || 0);
        const { error } = await admin.from('app_submissions').update({ payment_status: 'refunded', refunded_amount: Number.isFinite(refunded) ? refunded : 0 }).eq('id', submission.id);
        if (error) return fail('listing_refund_update_failed', 500, { record_id: submission.id, database_error: error.message });
      }
      console.log('[SALLA-WEBHOOK:SUCCESS]', JSON.stringify({ transaction_id: transactionId, event: event || null, status: status || null, target, record_id: submission.id, outcome: isPaid ? 'paid' : 'refunded', duration_ms: Date.now() - startedAt }));
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: promotion } = await admin.from('app_promotions').select('id,app_id,kind,duration_days,status').eq('payment_transaction_id', transactionId).maybeSingle();
    if (!promotion) return fail('transaction_not_found', 404);
    target = 'promotion';

    if (isPaid) {
      const { data: app, error: appError } = await admin.from('apps').select('id,boost_until,home_ad_until').eq('id', promotion.app_id).maybeSingle();
      if (appError || !app) return fail('promotion_app_not_found', 404, { record_id: promotion.id });
      const field = promotion.kind === 'home_ad' ? 'home_ad_until' : 'boost_until';
      const current = app[field] ? new Date(app[field]).getTime() : 0;
      const now = Date.now();
      const startMs = Math.max(now, current);
      const endMs = startMs + Number(promotion.duration_days) * 86400000;
      const startsAt = new Date(startMs).toISOString();
      const endsAt = new Date(endMs).toISOString();

      const { error: appUpdateError } = await admin.from('apps').update({ [field]: endsAt }).eq('id', app.id);
      if (appUpdateError) return fail('promotion_app_update_failed', 500, { record_id: promotion.id, database_error: appUpdateError.message });
      const { error: promotionError } = await admin.from('app_promotions').update({
        status: 'active', paid_at: new Date().toISOString(), starts_at: startsAt, ends_at: endsAt, updated_at: new Date().toISOString()
      }).eq('id', promotion.id);
      if (promotionError) return fail('promotion_update_failed', 500, { record_id: promotion.id, database_error: promotionError.message });
    } else {
      const refunded = Number(body?.amount || body?.data?.amount || body?.refund_amount || 0);
      const { error } = await admin.from('app_promotions').update({ status: 'refunded', refunded_amount: Number.isFinite(refunded) ? refunded : 0, updated_at: new Date().toISOString() }).eq('id', promotion.id);
      if (error) return fail('promotion_refund_update_failed', 500, { record_id: promotion.id, database_error: error.message });
    }

    console.log('[SALLA-WEBHOOK:SUCCESS]', JSON.stringify({ transaction_id: transactionId, event: event || null, status: status || null, target, record_id: promotion.id, promotion_kind: promotion.kind, outcome: isPaid ? 'activated' : 'refunded', duration_ms: Date.now() - startedAt }));
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return fail('unexpected_error', 500, { message: error instanceof Error ? error.message : String(error) });
  }
});
