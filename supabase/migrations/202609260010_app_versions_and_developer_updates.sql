-- Salla Browser v010
-- App versions developer update review flow and primary admin account.

alter table public.apps
  add column if not exists version text not null default '1.0.0';

alter table public.app_submissions
  add column if not exists app_id uuid references public.apps(id) on delete cascade,
  add column if not exists submission_type text not null default 'new',
  add column if not exists app_version text not null default '1.0.0';

do $$
begin
  alter table public.apps
    add constraint apps_version_length_check check (char_length(version) between 1 and 32);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.app_submissions
    add constraint app_submissions_version_length_check check (char_length(app_version) between 1 and 32);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.app_submissions
    add constraint app_submissions_type_check check (submission_type in ('new','update'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.app_submissions
    add constraint app_submissions_target_check check (
      (submission_type = 'new' and app_id is null)
      or
      (submission_type = 'update' and app_id is not null)
    );
exception when duplicate_object then null;
end $$;

create index if not exists app_submissions_app_idx
  on public.app_submissions(app_id, created_at desc)
  where app_id is not null;

-- Keep the requested primary account as an administrator.
insert into public.profiles (id, email, display_name, role)
select id, email, coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(coalesce(email,''),'@',1)), 'admin'
from auth.users
where lower(coalesce(email,'')) = 'pisallashop@gmail.com'
on conflict (id) do update
set email = excluded.email,
    role = 'admin',
    updated_at = now();

update public.profiles
set role = 'admin', updated_at = now()
where lower(coalesce(email,'')) = 'pisallashop@gmail.com';

-- New or refreshed copies of the same account remain admin while normal
-- developer accounts continue to be activated by the existing auth flow.
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
    case
      when lower(coalesce(new.email,'')) = 'pisallashop@gmail.com' then 'admin'
      when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer'
      else 'user'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = case
          when public.profiles.display_name is null or public.profiles.display_name = '' then excluded.display_name
          when public.profiles.display_name = split_part(coalesce(public.profiles.email,''),'@',1) then excluded.display_name
          else public.profiles.display_name
        end,
        role = case
          when lower(coalesce(new.email,'')) = 'pisallashop@gmail.com' then 'admin'
          when public.profiles.role = 'admin' then 'admin'
          when coalesce(new.raw_user_meta_data->>'account_type','') = 'developer' then 'developer'
          else public.profiles.role
        end,
        updated_at = now();
  return new;
end;
$$;

-- Developers may read their own draft apps so they can prepare an update
-- without exposing unpublished apps to other visitors.
drop policy if exists "apps_public_read" on public.apps;
create policy "apps_public_read"
on public.apps
for select
using (
  status = 'published'
  or created_by = auth.uid()
  or public.is_admin()
);

-- New submissions remain developer only. Update submissions additionally
-- require ownership of the target app. The live app itself is never changed
-- until an administrator approves the submission.
drop policy if exists "submissions_developer_insert" on public.app_submissions;
drop policy if exists "submissions_owner_insert" on public.app_submissions;
create policy "submissions_developer_insert"
on public.app_submissions
for insert
with check (
  user_id = auth.uid()
  and public.is_developer_or_admin()
  and (
    (submission_type = 'new' and app_id is null)
    or
    (
      submission_type = 'update'
      and app_id is not null
      and exists (
        select 1
        from public.apps a
        where a.id = app_id
          and a.created_by = auth.uid()
      )
    )
  )
);

drop policy if exists "submissions_owner_delete_pending" on public.app_submissions;
create policy "submissions_owner_delete_pending"
on public.app_submissions
for delete
using (
  user_id = auth.uid()
  and status in ('pending','changes_requested')
);
