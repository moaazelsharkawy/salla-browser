-- Salla Browser v014 - paid promotions
alter table public.apps add column if not exists boost_until timestamptz;
alter table public.apps add column if not exists home_ad_until timestamptz;

create table if not exists public.app_promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  kind text not null check (kind in ('boost','home_ad')),
  duration_days integer not null check (duration_days between 1 and 365),
  amount numeric(18,8) not null check (amount >= 0),
  currency text not null default 'pi' check (currency='pi'),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','active','expired','refunded','payment_failed')),
  payment_transaction_id text,
  payment_checkout_url text,
  payment_started_at timestamptz,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  refunded_amount numeric(18,8) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists app_promotions_tx_uidx on public.app_promotions(payment_transaction_id) where payment_transaction_id is not null;
create index if not exists app_promotions_owner_idx on public.app_promotions(user_id,created_at desc);
create index if not exists app_promotions_app_idx on public.app_promotions(app_id,status,ends_at desc);
alter table public.app_promotions enable row level security;
grant select on public.app_promotions to authenticated;
drop policy if exists "promotion owner can read" on public.app_promotions;
create policy "promotion owner can read" on public.app_promotions for select to authenticated using (auth.uid()=user_id or public.is_admin());

insert into public.app_settings(key,value,is_public) values(
  'developer_promotions',
  jsonb_build_object('boost_enabled',true,'boost_daily_price',0.25,'boost_max_days',30,'home_ad_enabled',true,'home_ad_daily_price',1,'home_ad_max_days',14,'home_ad_slots',4),
  true
) on conflict (key) do nothing;

create or replace function public.create_app_promotion_request(p_app_id uuid,p_kind text,p_days integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare cfg jsonb; price numeric; max_days integer; enabled boolean; slot_limit integer; active_ads integer; result_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if p_kind not in ('boost','home_ad') then raise exception 'invalid_promotion_kind'; end if;
  if not exists(select 1 from public.apps a where a.id=p_app_id and a.created_by=auth.uid() and a.status='published') then raise exception 'promotion_app_not_found'; end if;
  select value into cfg from public.app_settings where key='developer_promotions'; cfg:=coalesce(cfg,'{}'::jsonb);
  if p_kind='boost' then
    enabled:=coalesce((cfg->>'boost_enabled')::boolean,true); price:=greatest(0,coalesce((cfg->>'boost_daily_price')::numeric,0.25)); max_days:=greatest(1,coalesce((cfg->>'boost_max_days')::integer,30));
  else
    enabled:=coalesce((cfg->>'home_ad_enabled')::boolean,true); price:=greatest(0,coalesce((cfg->>'home_ad_daily_price')::numeric,1)); max_days:=greatest(1,coalesce((cfg->>'home_ad_max_days')::integer,14)); slot_limit:=greatest(1,coalesce((cfg->>'home_ad_slots')::integer,4));
    select count(*) into active_ads from public.apps where home_ad_until>now(); if active_ads>=slot_limit then raise exception 'home_ad_slots_full'; end if;
  end if;
  if not enabled then raise exception 'promotion_disabled'; end if;
  if p_days<1 or p_days>max_days then raise exception 'invalid_promotion_duration'; end if;
  insert into public.app_promotions(user_id,app_id,kind,duration_days,amount,currency,status)
  values(auth.uid(),p_app_id,p_kind,p_days,price*p_days,'pi','awaiting_payment') returning id into result_id;
  return result_id;
end; $$;
revoke all on function public.create_app_promotion_request(uuid,text,integer) from public;
grant execute on function public.create_app_promotion_request(uuid,text,integer) to authenticated;
