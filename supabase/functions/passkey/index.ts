import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from 'npm:@simplewebauthn/server@13.1.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RP_ID = Deno.env.get('PASSKEY_RP_ID') || 'browser.salla-shop.com';
const EXPECTED_ORIGINS = (Deno.env.get('PASSKEY_ORIGIN') || 'https://browser.salla-shop.com').split(',').map((value) => value.trim()).filter(Boolean);
const RP_NAME = Deno.env.get('PASSKEY_RP_NAME') || 'Salla Browser';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function bytesToB64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function b64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function storeChallenge(input: { userId?: string; email?: string; kind: 'registration' | 'authentication'; challenge: string }) {
  await admin.from('passkey_challenges').delete().lt('expires_at', new Date().toISOString());
  if (input.userId) await admin.from('passkey_challenges').delete().eq('user_id', input.userId).eq('kind', input.kind);
  if (input.email) await admin.from('passkey_challenges').delete().eq('email', input.email.toLowerCase()).eq('kind', input.kind);
  const { error } = await admin.from('passkey_challenges').insert({
    user_id: input.userId || null,
    email: input.email?.toLowerCase() || null,
    kind: input.kind,
    challenge: input.challenge,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
  if (error) throw error;
}

async function getChallenge(input: { userId?: string; email?: string; kind: 'registration' | 'authentication' }) {
  let query = admin.from('passkey_challenges').select('*').eq('kind', input.kind).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1);
  if (input.userId) query = query.eq('user_id', input.userId);
  if (input.email) query = query.eq('email', input.email.toLowerCase());
  const { data, error } = await query.maybeSingle();
  if (error || !data) throw new Error('PASSKEY_CHALLENGE_EXPIRED');
  return data;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '');

    if (action === 'register_options') {
      const user = await authenticatedUser(request);
      if (!user?.email) return json({ ok: false, error: 'AUTH_REQUIRED' }, 401);
      const { data: developerProfile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!developerProfile || !['developer','admin'].includes(String(developerProfile.role))) return json({ ok: false, error: 'DEVELOPER_ACCOUNT_REQUIRED' }, 403);
      const { data: credentials, error } = await admin.from('passkeys').select('credential_id, transports').eq('user_id', user.id);
      if (error) throw error;
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.email,
        userID: new TextEncoder().encode(user.id),
        userDisplayName: String(user.user_metadata?.display_name || user.email),
        attestationType: 'none',
        excludeCredentials: (credentials || []).map((item) => ({ id: item.credential_id, transports: item.transports || [] })),
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      });
      await storeChallenge({ userId: user.id, kind: 'registration', challenge: options.challenge });
      return json({ ok: true, options });
    }

    if (action === 'register_verify') {
      const user = await authenticatedUser(request);
      if (!user) return json({ ok: false, error: 'AUTH_REQUIRED' }, 401);
      const { data: developerProfile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!developerProfile || !['developer','admin'].includes(String(developerProfile.role))) return json({ ok: false, error: 'DEVELOPER_ACCOUNT_REQUIRED' }, 403);
      const challenge = await getChallenge({ userId: user.id, kind: 'registration' });
      const verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: EXPECTED_ORIGINS,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      });
      if (!verification.verified || !verification.registrationInfo) return json({ ok: false, error: 'PASSKEY_REGISTRATION_NOT_VERIFIED' }, 400);
      const info = verification.registrationInfo;
      const credential = info.credential;
      const { error } = await admin.from('passkeys').upsert({
        user_id: user.id,
        credential_id: credential.id,
        public_key_b64: bytesToB64(credential.publicKey),
        counter: credential.counter,
        transports: body.response?.response?.transports || credential.transports || [],
        device_type: info.credentialDeviceType,
        backed_up: info.credentialBackedUp,
        label: String(body.label || 'My device').slice(0, 80),
      }, { onConflict: 'credential_id' });
      if (error) throw error;
      await admin.from('passkey_challenges').delete().eq('id', challenge.id);
      return json({ ok: true });
    }

    if (action === 'auth_options') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return json({ ok: false, error: 'EMAIL_REQUIRED' }, 400);
      const { data: profile } = await admin.from('profiles').select('id,email,role').eq('email', email).maybeSingle();
      if (!profile || !['developer','admin'].includes(String(profile.role))) return json({ ok: false, error: 'PASSKEY_NOT_AVAILABLE' }, 404);
      const { data: credentials, error } = await admin.from('passkeys').select('credential_id,transports').eq('user_id', profile.id);
      if (error) throw error;
      if (!credentials?.length) return json({ ok: false, error: 'PASSKEY_NOT_AVAILABLE' }, 404);
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: credentials.map((item) => ({ id: item.credential_id, transports: item.transports || [] })),
        userVerification: 'required',
      });
      await storeChallenge({ userId: profile.id, email, kind: 'authentication', challenge: options.challenge });
      return json({ ok: true, options });
    }

    if (action === 'auth_verify') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return json({ ok: false, error: 'EMAIL_REQUIRED' }, 400);
      const { data: profile } = await admin.from('profiles').select('id,email,role').eq('email', email).maybeSingle();
      if (!profile?.email || !['developer','admin'].includes(String(profile.role))) return json({ ok: false, error: 'PASSKEY_NOT_AVAILABLE' }, 404);
      const challenge = await getChallenge({ userId: profile.id, email, kind: 'authentication' });
      const credentialId = String(body.response?.id || '');
      const { data: stored } = await admin.from('passkeys').select('*').eq('user_id', profile.id).eq('credential_id', credentialId).maybeSingle();
      if (!stored) return json({ ok: false, error: 'PASSKEY_NOT_AVAILABLE' }, 404);
      const verification = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: EXPECTED_ORIGINS,
        expectedRPID: RP_ID,
        credential: {
          id: stored.credential_id,
          publicKey: b64ToBytes(stored.public_key_b64),
          counter: Number(stored.counter || 0),
          transports: stored.transports || [],
        },
        requireUserVerification: true,
      });
      if (!verification.verified) return json({ ok: false, error: 'PASSKEY_AUTH_NOT_VERIFIED' }, 401);
      await admin.from('passkeys').update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq('id', stored.id);
      await admin.from('passkey_challenges').delete().eq('id', challenge.id);

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: profile.email });
      if (linkError || !linkData?.properties?.hashed_token) throw linkError || new Error('SESSION_TOKEN_FAILED');
      return json({ ok: true, token_hash: linkData.properties.hashed_token });
    }

    return json({ ok: false, error: 'UNKNOWN_ACTION' }, 400);
  } catch (error) {
    console.error('[PASSKEY][FAIL]', error);
    return json({ ok: false, error: error instanceof Error ? error.message : 'PASSKEY_FAILED' }, 400);
  }
});
