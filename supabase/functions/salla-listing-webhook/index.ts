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
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  const secret = Deno.env.get('SALLA_SHOP_WEBHOOK_SECRET') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!secret || !supabaseUrl || !serviceKey) return new Response('service_unavailable', { status: 503 });

  const raw = await req.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response('invalid_json', { status: 400 }); }

  const provided = (
    req.headers.get('x-signature') ||
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-salla-signature') ||
    req.headers.get('signature') || ''
  ).trim().replace(/^sha256=/i, '').toLowerCase();
  if (!provided) return new Response('missing_signature', { status: 401 });

  const rawExpected = await hmacHex(secret, raw);
  const normalizedExpected = await hmacHex(secret, JSON.stringify(body));
  if (!safeEqual(provided, rawExpected) && !safeEqual(provided, normalizedExpected)) return new Response('invalid_signature', { status: 401 });

  const transactionId = String(body?.transaction_id || body?.data?.transaction_id || body?.transaction?.id || '').trim();
  if (!transactionId) return new Response('missing_transaction', { status: 400 });

  const status = String(body?.status || body?.data?.status || body?.transaction?.status || '').toLowerCase();
  const event = String(body?.event || body?.type || '').toLowerCase();
  const isPaid = ['paid', 'completed', 'success', 'confirmed'].includes(status) || /payment.*(paid|complete|success|confirm)/.test(event);
  const isRefunded = ['refunded', 'refund'].includes(status) || /refund/.test(event);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (isPaid) {
    const { error } = await admin.from('app_submissions').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('payment_transaction_id', transactionId).eq('payment_status', 'awaiting_payment');
    if (error) { console.error('[listing-webhook] paid update error', error); return new Response('update_failed', { status: 500 }); }
  } else if (isRefunded) {
    const refunded = Number(body?.amount || body?.data?.amount || body?.refund_amount || 0);
    const { error } = await admin.from('app_submissions').update({ payment_status: 'refunded', refunded_amount: Number.isFinite(refunded) ? refunded : 0 }).eq('payment_transaction_id', transactionId);
    if (error) { console.error('[listing-webhook] refund update error', error); return new Response('update_failed', { status: 500 }); }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
