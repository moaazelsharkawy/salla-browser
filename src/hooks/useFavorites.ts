import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setFavoriteIds(new Set());
      return;
    }
    const { data } = await supabase.from('favorites').select('app_id').eq('user_id', user.id);
    setFavoriteIds(new Set((data ?? []).map((row: { app_id: string }) => row.app_id)));
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const toggleFavorite = useCallback(async (appId: string) => {
    if (!user || !isSupabaseConfigured) return false;
    const isFavorite = favoriteIds.has(appId);
    if (isFavorite) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('app_id', appId);
      if (error) throw error;
      setFavoriteIds((current) => {
        const next = new Set(current);
        next.delete(appId);
        return next;
      });
      return false;
    }
    const { error } = await supabase.from('favorites').upsert({ user_id: user.id, app_id: appId });
    if (error) throw error;
    setFavoriteIds((current) => new Set(current).add(appId));
    return true;
  }, [favoriteIds, user]);

  return { favoriteIds, toggleFavorite, refresh };
}
