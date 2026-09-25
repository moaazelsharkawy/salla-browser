import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

const FALLBACK_URL = 'https://example.supabase.co';
const FALLBACK_KEY = 'public-anon-placeholder';

const normalizeUrl = (value?: string) => (value || '').trim().replace(/\/+$/, '');
const normalizeKey = (value?: string) => (value || '').trim();

const isValidUrl = (value: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const isValidPublicKey = (value: string) => {
  if (!value || value.length < 20) return false;
  const lowered = value.toLowerCase();
  if (lowered.includes('placeholder') || lowered.includes('service_role')) return false;
  return value.startsWith('sb_publishable_') || value.split('.').length === 3 || value.length >= 32;
};

const readInitialConfig = (): RuntimeConfig => {
  const runtime = typeof window !== 'undefined' ? window.__SALLA_RUNTIME_CONFIG__ : undefined;
  return {
    SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || runtime?.SUPABASE_URL,
    SUPABASE_ANON_KEY:
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
      runtime?.SUPABASE_ANON_KEY,
    SITE_URL: (import.meta.env.VITE_SITE_URL as string | undefined) || runtime?.SITE_URL,
  };
};

const evaluateConfig = (config: RuntimeConfig) => {
  const url = normalizeUrl(config.SUPABASE_URL);
  const key = normalizeKey(config.SUPABASE_ANON_KEY);
  const issue = !url
    ? 'missing_url'
    : !key
      ? 'missing_anon_key'
      : !isValidUrl(url)
        ? 'invalid_url'
        : !isValidPublicKey(key)
          ? 'invalid_anon_key'
          : null;
  return { url, key, issue, configured: issue === null };
};

let evaluated = evaluateConfig(readInitialConfig());

export let isSupabaseConfigured = evaluated.configured;
export let supabaseConfigurationIssue: string | null = evaluated.issue;
export let supabase: SupabaseClient = createClient(
  evaluated.configured ? evaluated.url : FALLBACK_URL,
  evaluated.configured ? evaluated.key : FALLBACK_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

let ensurePromise: Promise<boolean> | null = null;

function applyConfig(config: RuntimeConfig) {
  const next = evaluateConfig(config);
  evaluated = next;
  isSupabaseConfigured = next.configured;
  supabaseConfigurationIssue = next.issue;

  if (next.configured) {
    supabase = createClient(next.url, next.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return true;
  }
  return false;
}

export async function ensureSupabaseConfigured(): Promise<boolean> {
  if (isSupabaseConfigured) return true;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    if (typeof window === 'undefined') return isSupabaseConfigured;

    try {
      const response = await fetch('/api/runtime-config?format=json', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const runtime = (await response.json()) as RuntimeConfig;
        window.__SALLA_RUNTIME_CONFIG__ = runtime;
        if (applyConfig(runtime)) return true;
      }
    } catch (error) {
      console.warn('[Salla Browser][Supabase] Runtime configuration request failed.', error);
    }

    const inlineRuntime = window.__SALLA_RUNTIME_CONFIG__;
    if (inlineRuntime && applyConfig(inlineRuntime)) return true;

    console.warn('[Salla Browser][Supabase] Public client configuration is incomplete.', {
      issue: supabaseConfigurationIssue,
    });
    return false;
  })().finally(() => {
    ensurePromise = null;
  });

  return ensurePromise;
}

export function getSupabaseConfigurationIssue() {
  return supabaseConfigurationIssue;
}
