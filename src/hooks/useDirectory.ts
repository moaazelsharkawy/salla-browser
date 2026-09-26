import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoApps, demoCategories } from '../lib/demo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Category, DirectoryApp } from '../types';

function activeUntil(value?: string | null) { return Boolean(value && new Date(value).getTime() > Date.now()); }

export function useDirectory() {
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    if (!isSupabaseConfigured) { setApps(demoApps); setCategories(demoCategories); setLoading(false); return; }
    try {
      const [{ data: categoryRows, error: categoryError }, { data: appRows, error: appError }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('apps').select('*, category:categories(*)').eq('status', 'published').order('sort_order')
      ]);
      if (categoryError) throw categoryError;
      if (appError) throw appError;
      const decorated = ((appRows ?? []) as DirectoryApp[]).sort((a, b) => {
        const aBoost = activeUntil(a.boost_until) ? 1 : 0;
        const bBoost = activeUntil(b.boost_until) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return Number(a.sort_order || 100) - Number(b.sort_order || 100);
      });
      setCategories((categoryRows ?? []) as Category[]);
      setApps(decorated);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : 'Directory load failed');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const homeAds = useMemo(() => apps.filter((app) => activeUntil(app.home_ad_until)), [apps]);
  const homeAdIds = useMemo(() => new Set(homeAds.map((app) => app.id)), [homeAds]);
  const featured = useMemo(() => apps.filter((app) => app.featured && !homeAdIds.has(app.id)), [apps, homeAdIds]);
  return { apps, categories, featured, homeAds, loading, error, refresh };
}
