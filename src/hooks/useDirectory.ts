import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoApps, demoCategories } from '../lib/demo';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Category, DirectoryApp } from '../types';

export function useDirectory() {
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setApps(demoApps);
      setCategories(demoCategories);
      setLoading(false);
      return;
    }

    try {
      const [{ data: categoryRows, error: categoryError }, { data: appRows, error: appError }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('apps').select('*, category:categories(*)').eq('status', 'published').order('sort_order')
      ]);
      if (categoryError) throw categoryError;
      if (appError) throw appError;
      setCategories((categoryRows ?? []) as Category[]);
      setApps((appRows ?? []) as DirectoryApp[]);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : 'Directory load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const featured = useMemo(() => apps.filter((app) => app.featured), [apps]);
  return { apps, categories, featured, loading, error, refresh };
}
