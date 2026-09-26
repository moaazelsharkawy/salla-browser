-- Salla Browser v013
-- Persistent developer form drafts

create table if not exists public.developer_submission_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_key text not null,
  app_id uuid references public.apps(id) on delete cascade,
  form_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, draft_key)
);

alter table public.developer_submission_drafts enable row level security;

grant select, insert, update, delete on public.developer_submission_drafts to authenticated;

drop policy if exists "developer drafts select own" on public.developer_submission_drafts;
create policy "developer drafts select own"
on public.developer_submission_drafts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "developer drafts insert own" on public.developer_submission_drafts;
create policy "developer drafts insert own"
on public.developer_submission_drafts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "developer drafts update own" on public.developer_submission_drafts;
create policy "developer drafts update own"
on public.developer_submission_drafts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "developer drafts delete own" on public.developer_submission_drafts;
create policy "developer drafts delete own"
on public.developer_submission_drafts
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists developer_submission_drafts_user_updated_idx
  on public.developer_submission_drafts(user_id, updated_at desc);
