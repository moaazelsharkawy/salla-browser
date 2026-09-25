-- Salla Browser v008
-- Idempotent developer-auth hardening for email/password and Google OAuth.
-- Requires the initial Salla Browser schema to be applied first.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'SALLA_BROWSER_INITIAL_SCHEMA_REQUIRED';
  end if;
end $$;

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
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name',''),
      nullif(new.raw_user_meta_data->>'full_name',''),
      nullif(new.raw_user_meta_data->>'name',''),
      split_part(coalesce(new.email,''),'@',1)
    ),
    case when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer' else 'user' end
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = case
          when public.profiles.display_name is null or public.profiles.display_name = '' then excluded.display_name
          when public.profiles.display_name = split_part(coalesce(public.profiles.email,''),'@',1) then excluded.display_name
          else public.profiles.display_name
        end,
        role = case
          when public.profiles.role = 'admin' then 'admin'
          when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer'
          else public.profiles.role
        end,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

create or replace function public.activate_developer_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  current_name text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  current_email := coalesce(auth.jwt()->>'email', '');
  current_name := coalesce(
    nullif(auth.jwt()->'user_metadata'->>'display_name',''),
    nullif(auth.jwt()->'user_metadata'->>'full_name',''),
    nullif(auth.jwt()->'user_metadata'->>'name',''),
    split_part(current_email, '@', 1)
  );

  insert into public.profiles (id, email, display_name, role)
  values (auth.uid(), nullif(current_email, ''), nullif(current_name, ''), 'developer')
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        display_name = case
          when public.profiles.display_name is null or public.profiles.display_name = '' then excluded.display_name
          when public.profiles.display_name = split_part(coalesce(public.profiles.email,''),'@',1) then excluded.display_name
          else public.profiles.display_name
        end,
        role = case when public.profiles.role = 'admin' then 'admin' else 'developer' end,
        updated_at = now();
end;
$$;

revoke all on function public.activate_developer_account() from public;
grant execute on function public.activate_developer_account() to authenticated;

insert into public.app_settings (key, value, is_public)
values (
  'developer_auth',
  jsonb_build_object(
    'google_oauth', true,
    'email_password', true,
    'passkey_after_signup', true,
    'callback_url', 'https://browser.salla-shop.com/auth/callback',
    'runtime_config', true
  ),
  true
)
on conflict (key) do update
set value = excluded.value,
    is_public = true,
    updated_at = now();
