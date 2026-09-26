-- Salla Browser v018: compatibility modes, lightweight health cache, public reports.
alter table public.apps drop constraint if exists apps_embed_mode_check;
alter table public.apps add constraint apps_embed_mode_check check (embed_mode in ('iframe','limited','external'));

-- Keep probe data outside apps so health checks never touch apps.updated_at.
create table if not exists public.app_health_checks (
  app_id uuid primary key references public.apps(id) on delete cascade,
  probe_status text not null default 'unknown' check (probe_status in ('unknown','online','offline')),
  checked_at timestamptz,
  latency_ms integer,
  http_status integer
);
alter table public.app_health_checks enable row level security;

alter table public.app_reports add column if not exists source text;
alter table public.app_reports add column if not exists client_info jsonb;

drop policy if exists "reports_public_insert_v018" on public.app_reports;
create policy "reports_public_insert_v018" on public.app_reports for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

grant insert (user_id,app_id,reason,details,status,source,client_info) on public.app_reports to anon, authenticated;
