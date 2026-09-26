import { isSupabaseConfigured, supabase } from './supabase';

export type ProbeResult = {
  app_id: string;
  probe_status: 'online' | 'offline' | 'unknown';
  http_status: number | null;
  latency_ms: number | null;
  checked_at: string | null;
  cached?: boolean;
};

export async function probeAppHealth(appId: string): Promise<ProbeResult | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.functions.invoke('app-health-check', { body: { app_id: appId } });
  if (error) throw error;
  return (data ?? null) as ProbeResult | null;
}
