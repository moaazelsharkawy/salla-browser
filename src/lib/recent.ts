import { isSupabaseConfigured, supabase } from './supabase';

export async function markAppOpened(userId: string | undefined, appId: string) {
  if (!userId || !isSupabaseConfigured) return;
  const { data } = await supabase.from('recent_apps').select('open_count').eq('user_id', userId).eq('app_id', appId).maybeSingle();
  await supabase.from('recent_apps').upsert({
    user_id: userId,
    app_id: appId,
    open_count: Number(data?.open_count ?? 0) + 1,
    last_opened_at: new Date().toISOString()
  }, { onConflict: 'user_id,app_id' });
}
