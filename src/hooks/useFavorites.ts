import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const LOCAL_KEY = 'salla-browser-pinned-apps-v2';

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
  } catch { return new Set<string>(); }
}
function writeLocal(value: Set<string>) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...value])); } catch { /* local pinning must not break browsing */ }
}

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => readLocal());

  const refresh = useCallback(async () => {
    const local = readLocal();
    if (!user || !isSupabaseConfigured) {
      setFavoriteIds(local);
      return;
    }
    const { data } = await supabase.from('favorites').select('app_id').eq('user_id', user.id);
    const remote = new Set((data ?? []).map((row: { app_id: string }) => row.app_id));
    const merged = new Set([...local, ...remote]);
    writeLocal(merged);
    setFavoriteIds(merged);
    const missingRemote = [...local].filter((id) => !remote.has(id));
    if (missingRemote.length) {
      await supabase.from('favorites').upsert(missingRemote.map((app_id) => ({ user_id: user.id, app_id })), { onConflict: 'user_id,app_id' });
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggleFavorite = useCallback(async (appId: string) => {
    const isFavorite = favoriteIds.has(appId);
    const next = new Set(favoriteIds);
    if (isFavorite) next.delete(appId); else next.add(appId);
    writeLocal(next);
    setFavoriteIds(next);

    if (user && isSupabaseConfigured) {
      if (isFavorite) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('app_id', appId);
        if (error) console.error('[favorites][delete]', error);
      } else {
        const { error } = await supabase.from('favorites').upsert({ user_id: user.id, app_id: appId }, { onConflict: 'user_id,app_id' });
        if (error) console.error('[favorites][upsert]', error);
      }
    }
    return !isFavorite;
  }, [favoriteIds, user]);

  return { favoriteIds, toggleFavorite, refresh };
}
