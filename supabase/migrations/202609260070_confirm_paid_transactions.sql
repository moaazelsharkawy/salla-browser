-- Salla Browser v015
-- Track successful Confirm API calls for paid listing and promotion transactions.

alter table public.app_submissions
  add column if not exists confirmed_at timestamptz;

alter table public.app_promotions
  add column if not exists confirmed_at timestamptz;

create index if not exists app_submissions_confirmed_at_idx
  on public.app_submissions(confirmed_at)
  where confirmed_at is not null;

create index if not exists app_promotions_confirmed_at_idx
  on public.app_promotions(confirmed_at)
  where confirmed_at is not null;
