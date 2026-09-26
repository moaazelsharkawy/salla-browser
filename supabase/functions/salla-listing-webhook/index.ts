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

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, '');
}

async function confirmTransaction(transactionId: string, apiKey: string, origin: string) {
  const response = await fetch('https://iagohfijczwnuihedsml.supabase.co/functions/v1/extapi-confirm', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Origin': origin,
    },
    body: JSON.stringify({ transaction_id: transactionId }),
  });

  const body = await response.json().catch(() => ({}));
  const accepted = response.ok && body?.success !== false;
  return {
    ok: accepted,
    httpStatus: response.status,
    providerError: body?.error || body?.message || null,
  };
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  let transactionId = '';
  let event = '';
  let status = '';
  let target = 'unknown';
  let recordId: string | null = null;
  let confirmCalled = false;
  let confirmSuccess = false;
  let confirmHttpStatus: number | null = null;

  const fail = (reason: string, httpStatus: number, extra: Record<string, unknown> = {}) => {
    console.error('[SALLA-WEBHOOK:FAILED]', JSON.stringify({
      reason,
      http_status: httpStatus,
      transaction_id: transactionId || null,
      event: event || null,
      status: status || null,
      target,
      record_id: recordId,
      confirm_called: confirmCalled,
      confirm_success: confirmSuccess,
      confirm_http_status: confirmHttpStatus,
      duration_ms: Date.now() - startedAt,
      ...extra,
    }));
    return new Response(JSON.stringify({ success: false, error: reason }), {
      status: httpStatus,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const success = (outcome: string, extra: Record<string, unknown> = {}) => {
    console.log('[SALLA-WEBHOOK:SUCCESS]', JSON.stringify({
      transaction_id: transactionId || null,
      event: event || null,
      status: status || null,
      target,
      record_id: recordId,
      outcome,
      payment_verified: true,
      confirm_called: confirmCalled,
      confirm_success: confirmSuccess,
      confirm_http_status: confirmHttpStatus,
      duration_ms: Date.now() - startedAt,
      ...extra,
    }));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    if (req.method !== 'POST') return fail('method_not_allowed', 405);

    const secret = Deno.env.get('SALLA_SHOP_WEBHOOK_SECRET') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const sallaApiKey = Deno.env.get('SALLA_SHOP_API_KEY') || '';
    const browserOrigin = normalizeOrigin(Deno.env.get('SALLA_BROWSER_ORIGIN') || 'https://browser.salla-shop.com');

    if (!secret || !supabaseUrl || !serviceKey || !sallaApiKey) {
      return fail('service_unavailable', 503, {
        missing_configuration: true,
        missing_webhook_secret: !secret,
        missing_api_key: !sallaApiKey,
      });
    }

    const raw = await req.text();
    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail('invalid_json', 400);
    }

    const provided = (
      req.headers.get('x-signature') ||
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-salla-signature') ||
      req.headers.get('signature') || ''
    ).trim().replace(/^sha256=/i, '').toLowerCase();

    if (!provided) return fail('missing_signature', 401);

    const rawExpected = await hmacHex(secret, raw);
    const normalizedExpected = await hmacHex(secret, JSON.stringify(body));
    if (!safeEqual(provided, rawExpected) && !safeEqual(provided, normalizedExpected)) {
      return fail('invalid_signature', 401);
    }

    transactionId = String(body?.transaction_id || body?.data?.transaction_id || body?.transaction?.id || '').trim();
    if (!transactionId) return fail('missing_transaction', 400);

    status = String(body?.status || body?.data?.status || body?.transaction?.status || '').toLowerCase();
    event = String(body?.event || body?.type || '').toLowerCase();

    const isPaid = ['paid', 'completed', 'success', 'confirmed'].includes(status) || /payment.*(paid|complete|success|confirm)/.test(event);
    const isRefunded = ['refunded', 'refund'].includes(status) || /refund/.test(event);

    if (!isPaid && !isRefunded) {
      target = 'ignored';
      return success('ignored_event', { payment_verified: false });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: submission, error: submissionLookupError } = await admin
      .from('app_submissions')
      .select('id,payment_status,paid_at,confirmed_at')
      .eq('payment_transaction_id', transactionId)
      .maybeSingle();

    if (submissionLookupError) {
      return fail('listing_lookup_failed', 500, { database_error: submissionLookupError.message });
    }

    if (submission) {
      target = 'listing';
      recordId = submission.id;

      if (isPaid) {
        if (!submission.confirmed_at) {
          confirmCalled = true;
          const confirm = await confirmTransaction(transactionId, sallaApiKey, browserOrigin);
          confirmSuccess = confirm.ok;
          confirmHttpStatus = confirm.httpStatus;
          if (!confirm.ok) {
            return fail('confirm_failed', 502, { provider_error: confirm.providerError });
          }
        } else {
          confirmSuccess = true;
        }

        const now = new Date().toISOString();
        const { error } = await admin.from('app_submissions').update({
          payment_status: 'paid',
          paid_at: submission.paid_at || now,
          confirmed_at: submission.confirmed_at || now,
        }).eq('id', submission.id);

        if (error) return fail('listing_update_failed', 500, { database_error: error.message });
        return success(submission.confirmed_at ? 'already_confirmed' : 'paid_and_confirmed');
      }

      const refunded = Number(body?.amount || body?.data?.amount || body?.refund_amount || 0);
      const { error } = await admin.from('app_submissions').update({
        payment_status: 'refunded',
        refunded_amount: Number.isFinite(refunded) ? refunded : 0,
      }).eq('id', submission.id);

      if (error) return fail('listing_refund_update_failed', 500, { database_error: error.message });
      return success('refunded', { refunded_amount: Number.isFinite(refunded) ? refunded : 0 });
    }

    const { data: promotion, error: promotionLookupError } = await admin
      .from('app_promotions')
      .select('id,app_id,kind,duration_days,status,starts_at,ends_at,confirmed_at')
      .eq('payment_transaction_id', transactionId)
      .maybeSingle();

    if (promotionLookupError) {
      return fail('promotion_lookup_failed', 500, { database_error: promotionLookupError.message });
    }
    if (!promotion) return fail('transaction_not_found', 404);

    target = 'promotion';
    recordId = promotion.id;

    if (isPaid) {
      if (!promotion.confirmed_at) {
        confirmCalled = true;
        const confirm = await confirmTransaction(transactionId, sallaApiKey, browserOrigin);
        confirmSuccess = confirm.ok;
        confirmHttpStatus = confirm.httpStatus;
        if (!confirm.ok) {
          return fail('confirm_failed', 502, { provider_error: confirm.providerError, promotion_kind: promotion.kind });
        }

        const confirmedAt = new Date().toISOString();
        const { error: confirmSaveError } = await admin.from('app_promotions').update({
          confirmed_at: confirmedAt,
          paid_at: confirmedAt,
          updated_at: confirmedAt,
        }).eq('id', promotion.id);
        if (confirmSaveError) return fail('promotion_confirm_save_failed', 500, { database_error: confirmSaveError.message });
      } else {
        confirmSuccess = true;
      }

      if (promotion.status === 'active' && promotion.ends_at) {
        return success('already_active', { promotion_kind: promotion.kind, ends_at: promotion.ends_at });
      }

      const { data: app, error: appError } = await admin
        .from('apps')
        .select('id,boost_until,home_ad_until')
        .eq('id', promotion.app_id)
        .maybeSingle();

      if (appError || !app) return fail('promotion_app_not_found', 404, { promotion_kind: promotion.kind });

      const field = promotion.kind === 'home_ad' ? 'home_ad_until' : 'boost_until';
      const current = app[field] ? new Date(app[field]).getTime() : 0;
      const nowMs = Date.now();
      const startMs = Math.max(nowMs, current);
      const endMs = startMs + Number(promotion.duration_days) * 86400000;
      const startsAt = new Date(startMs).toISOString();
      const endsAt = new Date(endMs).toISOString();

      const { error: appUpdateError } = await admin.from('apps').update({ [field]: endsAt }).eq('id', app.id);
      if (appUpdateError) return fail('promotion_app_update_failed', 500, { database_error: appUpdateError.message, promotion_kind: promotion.kind });

      const { error: promotionError } = await admin.from('app_promotions').update({
        status: 'active',
        starts_at: startsAt,
        ends_at: endsAt,
        updated_at: new Date().toISOString(),
      }).eq('id', promotion.id);

      if (promotionError) return fail('promotion_update_failed', 500, { database_error: promotionError.message, promotion_kind: promotion.kind });

      return success('confirmed_and_activated', {
        promotion_kind: promotion.kind,
        starts_at: startsAt,
        ends_at: endsAt,
      });
    }

    const refunded = Number(body?.amount || body?.data?.amount || body?.refund_amount || 0);
    const { error } = await admin.from('app_promotions').update({
      status: 'refunded',
      refunded_amount: Number.isFinite(refunded) ? refunded : 0,
      updated_at: new Date().toISOString(),
    }).eq('id', promotion.id);

    if (error) return fail('promotion_refund_update_failed', 500, { database_error: error.message, promotion_kind: promotion.kind });
    return success('refunded', { promotion_kind: promotion.kind, refunded_amount: Number.isFinite(refunded) ? refunded : 0 });
  } catch (error) {
    return fail('unexpected_error', 500, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
