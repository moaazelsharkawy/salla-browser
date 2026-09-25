-- Salla Browser v011 force hotfix
-- Fix app_submissions_target_check and repair approved apps visibility.
-- Safe to run more than once.

begin;

-- The original v010 constraint required app_id to stay NULL forever for
-- submission_type='new'. That conflicts with linking the approved request to
-- the app that was created from it. RLS already guarantees that developers
-- cannot submit a new request with an arbitrary app_id, so the table-level
-- target constraint only needs to require app_id for update requests.
alter table public.app_submissions
  drop constraint if exists app_submissions_target_check;

alter table public.app_submissions
  add constraint app_submissions_target_check check (
    submission_type = 'new'
    or (submission_type = 'update' and app_id is not null)
  ) not valid;

-- Link approved legacy new submissions to the app that was already created.
with legacy_matches as (
  select
    s.id as submission_id,
    (
      select a.id
      from public.apps a
      where a.created_by = s.user_id
        and a.website_url = s.website_url
        and a.name = s.app_name
      order by a.created_at desc
      limit 1
    ) as matched_app_id
  from public.app_submissions s
  where s.status = 'approved'
    and s.submission_type = 'new'
    and s.app_id is null
)
update public.app_submissions s
set app_id = m.matched_app_id,
    updated_at = now()
from legacy_matches m
where s.id = m.submission_id
  and m.matched_app_id is not null
  and s.app_id is null;

-- Publish approved linked apps that old approval flows left as drafts.
-- Suspended apps are intentionally not changed.
update public.apps a
set status = 'published',
    published_at = coalesce(a.published_at, s.reviewed_at, now()),
    updated_at = now()
from public.app_submissions s
where s.status = 'approved'
  and s.app_id = a.id
  and a.status = 'draft';

-- Install a self-healing approval RPC. Re-approving an already-approved legacy
-- request repairs its link/publication instead of creating a duplicate app.
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

  -- Repair an already approved legacy request instead of returning NULL.
  if s.status = 'approved' then
    v_app_id := s.app_id;

    if v_app_id is null then
      select a.id into v_app_id
      from public.apps a
      where a.created_by = s.user_id
        and a.website_url = s.website_url
        and a.name = s.app_name
      order by a.created_at desc
      limit 1;
    end if;

    if v_app_id is null and s.submission_type = 'new' then
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
        s.user_id, coalesce(s.reviewed_at, now())
      )
      on conflict (slug) do update
      set status = case
            when public.apps.status = 'draft' then 'published'
            else public.apps.status
          end,
          published_at = coalesce(public.apps.published_at, excluded.published_at),
          updated_at = now()
      returning id into v_app_id;
    end if;

    if v_app_id is not null then
      update public.app_submissions
      set app_id = v_app_id,
          updated_at = now()
      where id = s.id
        and app_id is distinct from v_app_id;

      update public.apps
      set status = 'published',
          published_at = coalesce(published_at, s.reviewed_at, now()),
          updated_at = now()
      where id = v_app_id
        and status = 'draft';
    end if;

    return v_app_id;
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
          published_at = coalesce(published_at, now()),
          updated_at = now()
      where id = s.app_id
        and created_by = s.user_id
      returning id into v_app_id;

      if v_app_id is null then
        raise exception 'Target app not found';
      end if;
    else
      v_app_id := s.app_id;

      if v_app_id is null then
        select a.id into v_app_id
        from public.apps a
        where a.created_by = s.user_id
          and a.website_url = s.website_url
          and a.name = s.app_name
        order by a.created_at desc
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
            published_at = coalesce(published_at, now()),
            updated_at = now()
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
      reviewed_at = now(),
      updated_at = now()
  where id = p_submission_id;

  return v_app_id;
end;
$$;

revoke all on function public.review_app_submission(uuid,text,text) from public;
grant execute on function public.review_app_submission(uuid,text,text) to authenticated;

-- Existing rows should satisfy this after the legacy repair. If an old malformed
-- update row exists, validation will identify it instead of silently weakening
-- the rule for future rows.
alter table public.app_submissions
  validate constraint app_submissions_target_check;

commit;
