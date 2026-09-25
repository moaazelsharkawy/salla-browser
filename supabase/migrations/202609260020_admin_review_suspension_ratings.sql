-- Salla Browser v011
-- Transactional submission review suspension notices and one rating per user per app

alter table public.apps
  add column if not exists suspension_reason text;

create table if not exists public.app_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create index if not exists app_ratings_app_idx on public.app_ratings(app_id);

drop trigger if exists app_ratings_touch_updated_at on public.app_ratings;
create trigger app_ratings_touch_updated_at
before update on public.app_ratings
for each row execute function public.touch_updated_at();

alter table public.app_ratings enable row level security;

drop policy if exists "app_ratings_public_read" on public.app_ratings;
create policy "app_ratings_public_read"
on public.app_ratings
for select
using (true);

drop policy if exists "app_ratings_owner_insert" on public.app_ratings;
create policy "app_ratings_owner_insert"
on public.app_ratings
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.apps a
    where a.id = app_id
      and a.status in ('published','suspended')
      and (a.created_by is null or a.created_by <> auth.uid())
  )
);

drop policy if exists "app_ratings_owner_update" on public.app_ratings;
create policy "app_ratings_owner_update"
on public.app_ratings
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.apps a
    where a.id = app_id
      and a.status in ('published','suspended')
      and (a.created_by is null or a.created_by <> auth.uid())
  )
);

grant select on public.app_ratings to anon, authenticated;
grant insert, update on public.app_ratings to authenticated;

-- Suspended apps stay readable from their details page so visitors see the
-- administrative warning while directory and browser queries continue to
-- request published apps only.
drop policy if exists "apps_public_read" on public.apps;
create policy "apps_public_read"
on public.apps
for select
using (
  status in ('published','suspended')
  or created_by = auth.uid()
  or public.is_admin()
);

-- Review an application submission and publish the app in one database
-- transaction. This avoids the old partial state where an app row was created
-- but the submission stayed pending and a second approval hit apps_slug_key.
create or replace function public.review_app_submission(
  p_submission_id uuid,
  p_status text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.app_submissions%rowtype;
  v_app_id uuid;
  v_slug text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('approved','rejected','changes_requested') then
    raise exception 'Invalid review status';
  end if;

  select * into s
  from public.app_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  -- Finalized submissions are idempotent. Repeating approval does not create
  -- another app and simply returns the already linked app.
  if s.status = 'approved' then
    return s.app_id;
  end if;

  if s.status = 'rejected' then
    raise exception 'Submission is already finalized';
  end if;

  if p_status = 'approved' then
    if s.submission_type = 'update' then
      if s.app_id is null then
        raise exception 'Update submission has no target app';
      end if;

      update public.apps
      set name = s.app_name,
          version = coalesce(nullif(s.app_version, ''), '1.0.0'),
          short_description_ar = left(s.description_ar, 160),
          short_description_en = left(s.description_en, 160),
          description_ar = s.description_ar,
          description_en = s.description_en,
          icon_url = s.icon_url,
          website_url = s.website_url,
          privacy_url = s.privacy_url,
          developer_name = s.contact_email,
          category_id = s.category_id,
          supported_countries = s.countries,
          status = 'published',
          suspension_reason = null,
          health_status = 'updated',
          published_at = coalesce(published_at, now())
      where id = s.app_id
        and created_by = s.user_id
      returning id into v_app_id;

      if v_app_id is null then
        raise exception 'Target app not found';
      end if;
    else
      -- Recover safely from an old partial approval if it already created the
      -- app before failing to mark the submission approved.
      if s.app_id is not null then
        select id into v_app_id from public.apps where id = s.app_id;
      end if;

      if v_app_id is null then
        select id into v_app_id
        from public.apps
        where created_by = s.user_id
          and website_url = s.website_url
          and name = s.app_name
        order by created_at desc
        limit 1;
      end if;

      if v_app_id is null then
        v_slug := 'app-' || substr(replace(s.id::text, '-', ''), 1, 12);
        insert into public.apps (
          slug, name, version, short_description_ar, short_description_en,
          description_ar, description_en, icon_url, website_url, privacy_url,
          developer_name, category_id, supported_countries, status, verified,
          featured, embed_mode, health_status, installable, sort_order,
          created_by, published_at
        ) values (
          v_slug, s.app_name, coalesce(nullif(s.app_version, ''), '1.0.0'),
          left(s.description_ar, 160), left(s.description_en, 160),
          s.description_ar, s.description_en, s.icon_url, s.website_url,
          s.privacy_url, s.contact_email, s.category_id, s.countries,
          'published', false, false, 'iframe', 'new', true, 100,
          s.user_id, now()
        ) returning id into v_app_id;
      else
        update public.apps
        set name = s.app_name,
            version = coalesce(nullif(s.app_version, ''), '1.0.0'),
            short_description_ar = left(s.description_ar, 160),
            short_description_en = left(s.description_en, 160),
            description_ar = s.description_ar,
            description_en = s.description_en,
            icon_url = s.icon_url,
            website_url = s.website_url,
            privacy_url = s.privacy_url,
            developer_name = s.contact_email,
            category_id = s.category_id,
            supported_countries = s.countries,
            status = 'published',
            suspension_reason = null,
            health_status = case when health_status = 'new' then 'new' else 'updated' end,
            published_at = coalesce(published_at, now())
        where id = v_app_id;
      end if;
    end if;
  else
    v_app_id := s.app_id;
  end if;

  update public.app_submissions
  set status = p_status,
      app_id = case when p_status = 'approved' then v_app_id else app_id end,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_submission_id;

  return v_app_id;
end;
$$;

revoke all on function public.review_app_submission(uuid,text,text) from public;
grant execute on function public.review_app_submission(uuid,text,text) to authenticated;
