import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { supabase } from './supabase';

async function invoke(body: Record<string, unknown>, authenticated = false) {
  const headers: Record<string, string> = {};
  if (authenticated) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error('AUTH_REQUIRED');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const { data, error } = await supabase.functions.invoke('passkey', { body, headers });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'PASSKEY_REQUEST_FAILED');
  return data;
}

export async function registerPasskey(label?: string) {
  if (!browserSupportsWebAuthn()) throw new Error('PASSKEY_UNSUPPORTED');
  const optionsResult = await invoke({ action: 'register_options' }, true);
  const response = await startRegistration({ optionsJSON: optionsResult.options });
  return invoke({ action: 'register_verify', response, label: label || 'My device' }, true);
}

export async function signInWithPasskey(email: string) {
  if (!browserSupportsWebAuthn()) throw new Error('PASSKEY_UNSUPPORTED');
  const optionsResult = await invoke({ action: 'auth_options', email });
  const response = await startAuthentication({ optionsJSON: optionsResult.options });
  const verifyResult = await invoke({ action: 'auth_verify', email, response });
  const { error } = await supabase.auth.verifyOtp({ token_hash: verifyResult.token_hash, type: 'magiclink' });
  if (error) throw error;
  return true;
}


export async function getPasskeyStatus() {
  const result = await invoke({ action: 'status' }, true);
  return { hasPasskey: Boolean(result.has_passkey), count: Number(result.count || 0) };
}
