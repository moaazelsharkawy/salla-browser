-- Salla Browser initial schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','developer','admin')),
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  icon text not null default 'store',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description_ar text not null default '',
  short_description_en text not null default '',
  description_ar text not null default '',
  description_en text not null default '',
  icon_url text,
  website_url text not null check (website_url ~* '^https?://'),
  privacy_url text,
  developer_name text,
  category_id uuid references public.categories(id) on delete set null,
  supported_countries text[] not null default array['ALL']::text[],
  status text not null default 'draft' check (status in ('draft','published','suspended')),
  verified boolean not null default false,
  featured boolean not null default false,
  embed_mode text not null default 'iframe' check (embed_mode in ('iframe','external')),
  health_status text not null default 'online' check (health_status in ('online','maintenance','new','updated','offline')),
  installable boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apps_status_sort_idx on public.apps(status, sort_order);
create index if not exists apps_category_idx on public.apps(category_id);
create index if not exists apps_featured_idx on public.apps(featured) where featured = true;
create index if not exists apps_countries_gin on public.apps using gin(supported_countries);

create table if not exists public.app_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_name text not null,
  website_url text not null check (website_url ~* '^https?://'),
  icon_url text,
  description_ar text not null default '',
  description_en text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  countries text[] not null default array['ALL']::text[],
  privacy_url text,
  contact_email text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','changes_requested')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_submissions_status_idx on public.app_submissions(status, created_at desc);
create index if not exists app_submissions_user_idx on public.app_submissions(user_id, created_at desc);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create table if not exists public.recent_apps (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  open_count integer not null default 1,
  last_opened_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create table if not exists public.app_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  app_id uuid not null references public.apps(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  body_ar text not null,
  body_en text not null,
  kind text not null default 'info' check (kind in ('info','success','warning')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Passkeys are manipulated by the Edge Function with service-role privileges.
create table if not exists public.passkeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key_b64 text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}'::text[],
  device_type text,
  backed_up boolean not null default false,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkeys_user_idx on public.passkeys(user_id);

create table if not exists public.passkey_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  kind text not null check (kind in ('registration','authentication')),
  challenge text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists passkey_challenges_lookup_idx on public.passkey_challenges(kind, user_id, email, expires_at desc);

create trigger categories_touch_updated_at before update on public.categories for each row execute function public.touch_updated_at();
create trigger apps_touch_updated_at before update on public.apps for each row execute function public.touch_updated_at();
create trigger submissions_touch_updated_at before update on public.app_submissions for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger reports_touch_updated_at before update on public.app_reports for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.apps enable row level security;
alter table public.app_submissions enable row level security;
alter table public.favorites enable row level security;
alter table public.recent_apps enable row level security;
alter table public.app_reports enable row level security;
alter table public.announcements enable row level security;
alter table public.app_settings enable row level security;
alter table public.passkeys enable row level security;
alter table public.passkey_challenges enable row level security;

-- Profiles
create policy "profiles_select_self_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Prevent clients from promoting themselves by limiting self-service profile updates to safe columns.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, country_code, updated_at) on public.profiles to authenticated;

-- Categories
create policy "categories_public_read" on public.categories for select using (is_active or public.is_admin());
create policy "categories_admin_insert" on public.categories for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories for update using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_delete" on public.categories for delete using (public.is_admin());

-- Apps
create policy "apps_public_read" on public.apps for select using (status = 'published' or public.is_admin());
create policy "apps_admin_insert" on public.apps for insert with check (public.is_admin());
create policy "apps_admin_update" on public.apps for update using (public.is_admin()) with check (public.is_admin());
create policy "apps_admin_delete" on public.apps for delete using (public.is_admin());

-- Submissions
create policy "submissions_owner_or_admin_read" on public.app_submissions for select using (user_id = auth.uid() or public.is_admin());
create policy "submissions_owner_insert" on public.app_submissions for insert with check (user_id = auth.uid());
create policy "submissions_admin_update" on public.app_submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "submissions_owner_delete_pending" on public.app_submissions for delete using (user_id = auth.uid() and status = 'pending');

-- Favorites / recent
create policy "favorites_owner_all" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recent_owner_all" on public.recent_apps for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reports
create policy "reports_owner_or_admin_read" on public.app_reports for select using (user_id = auth.uid() or public.is_admin());
create policy "reports_auth_insert" on public.app_reports for insert with check (auth.uid() is not null and (user_id = auth.uid() or user_id is null));
create policy "reports_admin_update" on public.app_reports for update using (public.is_admin()) with check (public.is_admin());

-- Announcements / settings
create policy "announcements_public_read" on public.announcements for select using (is_active or public.is_admin());
create policy "announcements_admin_all" on public.announcements for all using (public.is_admin()) with check (public.is_admin());
create policy "settings_public_read" on public.app_settings for select using (is_public or public.is_admin());
create policy "settings_admin_all" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- Passkeys: users can list/delete their own credentials, Edge service role handles writes.
create policy "passkeys_owner_read" on public.passkeys for select using (user_id = auth.uid());
create policy "passkeys_owner_delete" on public.passkeys for delete using (user_id = auth.uid());
-- No direct client policy for passkey_challenges.

-- Public app-asset storage bucket.
insert into storage.buckets (id, name, public) values ('app-assets','app-assets',true) on conflict (id) do update set public = true;
create policy "app_assets_public_read" on storage.objects for select using (bucket_id = 'app-assets');
create policy "app_assets_admin_insert" on storage.objects for insert with check (bucket_id = 'app-assets' and public.is_admin());
create policy "app_assets_admin_update" on storage.objects for update using (bucket_id = 'app-assets' and public.is_admin()) with check (bucket_id = 'app-assets' and public.is_admin());
create policy "app_assets_admin_delete" on storage.objects for delete using (bucket_id = 'app-assets' and public.is_admin());

insert into public.categories (slug,name_ar,name_en,description_ar,description_en,icon,sort_order)
values
('shopping','التسوق','Shopping','متاجر وخدمات منظومة Salla','Salla ecosystem shops and services','store',10),
('web3','Web3','Web3','تطبيقات Web3 والمحافظ','Web3 apps and wallets','blocks',20),
('finance','المالية','Finance','الدفع والخدمات المالية','Payments and finance','wallet',30),
('tools','الأدوات','Tools','أدوات مساعدة للمستخدمين','Useful tools','wrench',40),
('social','اجتماعي','Social','تطبيقات التواصل والمجتمع','Social and community apps','users',50),
('games','الألعاب','Games','ألعاب وتطبيقات ترفيهية','Games and entertainment','game',60)
on conflict (slug) do nothing;

insert into public.app_settings (key,value,is_public)
values ('directory', '{"allow_public_submissions":true,"default_country":"ALL"}'::jsonb, true)
on conflict (key) do nothing;
