-- Salla Browser v005
-- Developer-only accounts for app submission; browsing and local pinning stay public.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)),
    case when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer' else 'user' end
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(public.profiles.display_name,''), excluded.display_name),
        role = case
          when public.profiles.role = 'admin' then 'admin'
          when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer'
          else public.profiles.role
        end;
  return new;
end;
$$;

create or replace function public.is_developer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('developer','admin')
  );
$$;

-- Preserve existing test accounts created before v005 so they do not lose submission access.
update public.profiles set role = 'developer' where role = 'user';

-- App submission is now explicitly a developer/admin capability.
drop policy if exists "submissions_owner_insert" on public.app_submissions;
drop policy if exists "submissions_developer_insert" on public.app_submissions;
create policy "submissions_developer_insert"
on public.app_submissions
for insert
with check (user_id = auth.uid() and public.is_developer_or_admin());

-- Owners can continue to read/delete their own pending submissions; admins keep review rights.
-- No change to public app-directory read policies.

insert into public.app_settings (key, value, is_public)
values (
  'site',
  jsonb_build_object(
    'origin', 'https://browser.salla-shop.com',
    'account_scope', 'developers_only',
    'local_pinning_without_account', true,
    'search_engine', 'google_external',
    'seo_sitemap', 'https://browser.salla-shop.com/sitemap.xml'
  ),
  true
)
on conflict (key) do update set value = excluded.value, is_public = true, updated_at = now();
