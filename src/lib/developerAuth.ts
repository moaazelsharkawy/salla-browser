import { isSupabaseConfigured, supabase } from './supabase';

export async function activateDeveloperAccount() {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { error } = await supabase.rpc('activate_developer_account');
  if (error) throw error;
}

export async function signInWithGoogle(next = '/profile') {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED');
  const callback = new URL('/auth/callback', window.location.origin);
  callback.searchParams.set('next', next);
  callback.searchParams.set('source', 'google');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      queryParams: {
        prompt: 'select_account',
      },
    },
  });
  if (error) throw error;
}
