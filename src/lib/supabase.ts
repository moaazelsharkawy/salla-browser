import { createClient } from '@supabase/supabase-js';

type RuntimeConfig = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SITE_URL?: string;
};

declare global {
  interface Window {
    __SALLA_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

const runtimeConfig = typeof window !== 'undefined' ? window.__SALLA_RUNTIME_CONFIG__ : undefined;
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || runtimeConfig?.SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || runtimeConfig?.SUPABASE_ANON_KEY;

const validUrl = Boolean(supabaseUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl.trim()));
const validKey = Boolean(supabaseAnonKey && supabaseAnonKey.trim().length > 20 && !supabaseAnonKey.includes('placeholder'));

export const isSupabaseConfigured = validUrl && validKey;
export const supabaseConfigurationIssue = !supabaseUrl
  ? 'missing_url'
  : !supabaseAnonKey
    ? 'missing_anon_key'
    : !validUrl
      ? 'invalid_url'
      : !validKey
        ? 'invalid_anon_key'
        : null;

if (!isSupabaseConfigured) {
  console.warn('[Salla Browser][Supabase] Public client configuration is incomplete.', {
    issue: supabaseConfigurationIssue,
    runtimeConfigLoaded: Boolean(runtimeConfig),
  });
}

export const supabase = createClient(
  validUrl ? supabaseUrl!.trim() : 'https://example.supabase.co',
  validKey ? supabaseAnonKey!.trim() : 'public-anon-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
