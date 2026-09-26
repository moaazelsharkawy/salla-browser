-- Salla Browser v012
-- Developer listing controls and Salla Shop hosted checkout state

alter table public.app_submissions
  add column if not exists payment_status text not null default 'not_required',
  add column if not exists listing_price numeric(18,8) not null default 0,
  add column if not exists payment_currency text not null default 'pi',
  add column if not exists payment_transaction_id text,
  add column if not exists payment_checkout_url text,
  add column if not exists payment_started_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists refunded_amount numeric(18,8) not null default 0;

alter table public.app_submissions drop constraint if exists app_submissions_payment_status_check;
alter table public.app_submissions add constraint app_submissions_payment_status_check
  check (payment_status in ('not_required','awaiting_payment','paid','refunded','payment_failed'));

alter table public.app_submissions drop constraint if exists app_submissions_payment_currency_check;
alter table public.app_submissions add constraint app_submissions_payment_currency_check
  check (payment_currency in ('pi'));

create unique index if not exists app_submissions_payment_transaction_uidx
  on public.app_submissions(payment_transaction_id)
  where payment_transaction_id is not null;

-- Keep target rules compatible with approved new submissions that are linked
-- to the application created during review.
alter table public.app_submissions drop constraint if exists app_submissions_target_check;
alter table public.app_submissions add constraint app_submissions_target_check
  check (
    submission_type = 'new'
    or (submission_type = 'update' and app_id is not null)
  );

insert into public.app_settings (key, value, is_public)
values (
  'developer_listing',
  jsonb_build_object(
    'listing_enabled', true,
    'fee_enabled', false,
    'fee_amount', 0,
    'currency', 'pi',
    'max_apps_per_developer', 5,
    'max_pending_submissions', 2
  ),
  true
)
on conflict (key) do nothing;

create or replace function public.prepare_app_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg jsonb;
  enabled boolean;
  fee_enabled boolean;
  fee_amount numeric;
  max_apps integer;
  max_pending integer;
  app_count integer;
  pending_count integer;
begin
  -- Clients may not choose review or payment state when creating a request.
  new.status := 'pending';
  new.review_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;

  select value into cfg from public.app_settings where key = 'developer_listing';
  cfg := coalesce(cfg, '{}'::jsonb);
  enabled := coalesce((cfg->>'listing_enabled')::boolean, true);
  fee_enabled := coalesce((cfg->>'fee_enabled')::boolean, false);
  fee_amount := greatest(0, coalesce((cfg->>'fee_amount')::numeric, 0));
  max_apps := greatest(1, coalesce((cfg->>'max_apps_per_developer')::integer, 5));
  max_pending := greatest(1, coalesce((cfg->>'max_pending_submissions')::integer, 2));

  select count(*) into pending_count
  from public.app_submissions s
  where s.user_id = new.user_id
    and s.status in ('pending','changes_requested');

  if pending_count >= max_pending then
    raise exception 'developer_pending_limit';
  end if;

  if new.submission_type = 'new' then
    if not enabled then
      raise exception 'listing_disabled';
    end if;

    select count(*) into app_count
    from public.apps a
    where a.created_by = new.user_id
      and a.status in ('draft','published','suspended');

    if app_count >= max_apps then
      raise exception 'developer_app_limit';
    end if;

    new.app_id := null;
    new.payment_currency := 'pi';
    new.listing_price := case when fee_enabled then fee_amount else 0 end;
    new.payment_status := case when fee_enabled and fee_amount > 0 then 'awaiting_payment' else 'not_required' end;
    new.payment_transaction_id := null;
    new.payment_checkout_url := null;
    new.payment_started_at := null;
    new.paid_at := null;
    new.refunded_amount := 0;
  else
    if new.app_id is null or not exists (
      select 1 from public.apps a where a.id = new.app_id and a.created_by = new.user_id
    ) then
      raise exception 'invalid_update_target';
    end if;
    new.listing_price := 0;
    new.payment_currency := 'pi';
    new.payment_status := 'not_required';
    new.payment_transaction_id := null;
    new.payment_checkout_url := null;
    new.payment_started_at := null;
    new.paid_at := null;
    new.refunded_amount := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_app_submission_before_insert on public.app_submissions;
create trigger prepare_app_submission_before_insert
before insert on public.app_submissions
for each row execute function public.prepare_app_submission();

-- Review remains transactional and now refuses unpaid new listings.
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
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('approved','rejected','changes_requested') then raise exception 'Invalid review status'; end if;

  select * into s from public.app_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status = 'approved' then return s.app_id; end if;
  if s.status = 'rejected' then raise exception 'Submission is already finalized'; end if;

  if s.submission_type = 'new' and s.payment_status not in ('paid','not_required') then
    raise exception 'payment_required';
  end if;

  if p_status = 'approved' then
    if s.submission_type = 'update' then
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
      where id = s.app_id and created_by = s.user_id
      returning id into v_app_id;
      if v_app_id is null then raise exception 'Target app not found'; end if;
    else
      if s.app_id is not null then select id into v_app_id from public.apps where id = s.app_id; end if;
      if v_app_id is null then
        select id into v_app_id from public.apps
        where created_by = s.user_id and website_url = s.website_url and name = s.app_name
        order by created_at desc limit 1;
      end if;
      if v_app_id is null then
        v_slug := 'app-' || substr(replace(s.id::text, '-', ''), 1, 12);
        insert into public.apps (
          slug, name, version, short_description_ar, short_description_en,
          description_ar, description_en, icon_url, website_url, privacy_url,
          developer_name, category_id, supported_countries, status, verified,
          featured, embed_mode, health_status, installable, sort_order, created_by, published_at
        ) values (
          v_slug, s.app_name, coalesce(nullif(s.app_version, ''), '1.0.0'),
          left(s.description_ar, 160), left(s.description_en, 160),
          s.description_ar, s.description_en, s.icon_url, s.website_url, s.privacy_url,
          s.contact_email, s.category_id, s.countries, 'published', false, false,
          'iframe', 'new', true, 100, s.user_id, now()
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
