import type { DirectoryApp } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const LOCAL_KEY = 'salla-browser-recent-apps-v3';
const OPEN_COUNT_KEY = 'salla-browser-open-count-v1';
const MAX_RECENT = 12;

export type RecentLocalApp = Pick<DirectoryApp, 'id' | 'slug' | 'name' | 'icon_url' | 'short_description_ar' | 'short_description_en'> & {
  last_opened_at: string;
};

function readLocalRecent(): RecentLocalApp[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.slug === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeLocalRecent(items: RecentLocalApp[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_RECENT))); } catch { /* browsing must keep working */ }
}

export function getRecentApps() {
  return readLocalRecent();
}

export function getRecentAppIds() {
  return readLocalRecent().map((item) => item.id);
}

export function clearRecentApps() {
  writeLocalRecent([]);
  window.dispatchEvent(new CustomEvent('salla-recent-updated'));
}

export function getBrowseOpenCount() {
  try { return Math.max(0, Number(localStorage.getItem(OPEN_COUNT_KEY) || 0)); }
  catch { return 0; }
}

function bumpOpenCount() {
  const next = getBrowseOpenCount() + 1;
  try { localStorage.setItem(OPEN_COUNT_KEY, String(next)); } catch { /* local metric only */ }
  return next;
}

function saveLocalApp(app: DirectoryApp) {
  const now = new Date().toISOString();
  const next: RecentLocalApp = {
    id: app.id,
    slug: app.slug,
    name: app.name,
    icon_url: app.icon_url,
    short_description_ar: app.short_description_ar,
    short_description_en: app.short_description_en,
    last_opened_at: now,
  };
  writeLocalRecent([next, ...readLocalRecent().filter((item) => item.id !== app.id)]);
  bumpOpenCount();
  window.dispatchEvent(new CustomEvent('salla-recent-updated', { detail: { app_id: app.id } }));
}

export async function markAppOpened(userId: string | undefined, app: DirectoryApp) {
  saveLocalApp(app);
  if (!userId || !isSupabaseConfigured) return;
  const { data } = await supabase.from('recent_apps').select('open_count').eq('user_id', userId).eq('app_id', app.id).maybeSingle();
  await supabase.from('recent_apps').upsert({
    user_id: userId,
    app_id: app.id,
    open_count: Number(data?.open_count ?? 0) + 1,
    last_opened_at: new Date().toISOString()
  }, { onConflict: 'user_id,app_id' });
}
