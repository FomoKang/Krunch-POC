create extension if not exists "pgcrypto";

create table if not exists public.items (
  id text primary key,
  title text not null,
  artist_name text not null,
  category text not null,
  auction_status text not null check (auction_status in ('live_now', 'coming_soon', 'sold_out')),
  current_price numeric null,
  image_url text null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.items enable row level security;

drop policy if exists "items_select_all" on public.items;
create policy "items_select_all"
on public.items
for select
to anon, authenticated
using (true);

insert into public.items (id, title, artist_name, category, auction_status, current_price, image_url)
values
  ('premium-peaceminusone-cap', 'PEACEMINUSONE1988-CAP', 'G-DRAGON', 'premium_auction', 'live_now', 52000000, '/cap2.png'),
  ('hybrid-burberry-trench', 'Burberry Trench Jacket', 'SON HEUNG MIN', 'hybrid_auction', 'coming_soon', 3240000, '/son-burberry.png'),
  ('hybrid-squid-mask', 'Squid Game 2 Guard Mask', 'PARK GYU YOUNG', 'hybrid_auction', 'coming_soon', null, '/squid-mask.png'),
  ('hybrid-recruiter-suit', 'The Recruiter Suit', 'GONG YOO', 'hybrid_auction', 'live_now', 8880000, '/gongyoo-suit.png'),
  ('hybrid-human-made-tee', 'Human Made Heart Tee', 'FELIX', 'hybrid_auction', 'sold_out', null, '/felix-human.png')
on conflict (id) do update
set
  title = excluded.title,
  artist_name = excluded.artist_name,
  category = excluded.category,
  auction_status = excluded.auction_status,
  current_price = excluded.current_price,
  image_url = excluded.image_url;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'favorite_items_item_id_fkey'
      and conrelid = 'public.favorite_items'::regclass
  ) then
    alter table public.favorite_items
      add constraint favorite_items_item_id_fkey
      foreign key (item_id)
      references public.items (id)
      on delete cascade
      not valid;
  end if;
end $$;

drop policy if exists "favorite_items_update_own" on public.favorite_items;
create policy "favorite_items_update_own"
on public.favorite_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.auction_participations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  status text not null check (status in ('watching', 'bid_placed', 'leading', 'outbid')),
  current_bid numeric null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, item_id)
);

alter table public.auction_participations enable row level security;

drop policy if exists "auction_participations_select_own" on public.auction_participations;
create policy "auction_participations_select_own"
on public.auction_participations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "auction_participations_insert_own" on public.auction_participations;
create policy "auction_participations_insert_own"
on public.auction_participations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "auction_participations_update_own" on public.auction_participations;
create policy "auction_participations_update_own"
on public.auction_participations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "auction_participations_delete_own" on public.auction_participations;
create policy "auction_participations_delete_own"
on public.auction_participations
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.owned_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  acquired_at timestamptz not null default timezone('utc', now()),
  source text not null check (source in ('gallery_seed', 'auction', 'draw')),
  unique (user_id, item_id, source)
);

alter table public.owned_items enable row level security;

drop policy if exists "owned_items_select_own" on public.owned_items;
create policy "owned_items_select_own"
on public.owned_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "owned_items_insert_own" on public.owned_items;
create policy "owned_items_insert_own"
on public.owned_items
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.viewed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null references public.items (id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  unique (user_id, item_id)
);

alter table public.viewed_items enable row level security;

drop policy if exists "viewed_items_select_own" on public.viewed_items;
create policy "viewed_items_select_own"
on public.viewed_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "viewed_items_insert_own" on public.viewed_items;
create policy "viewed_items_insert_own"
on public.viewed_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "viewed_items_update_own" on public.viewed_items;
create policy "viewed_items_update_own"
on public.viewed_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "viewed_items_delete_own" on public.viewed_items;
create policy "viewed_items_delete_own"
on public.viewed_items
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text null references public.items (id) on delete set null,
  type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists auction_participations_user_created_idx
  on public.auction_participations (user_id, created_at desc);

create index if not exists owned_items_user_acquired_idx
  on public.owned_items (user_id, acquired_at desc);

create index if not exists viewed_items_user_viewed_idx
  on public.viewed_items (user_id, viewed_at desc);

insert into public.profiles as existing_profile (id, email, nickname)
select id, email, coalesce(raw_user_meta_data ->> 'nickname', 'jeniusokg')
from auth.users
where lower(email) = 'jeniusokg@gmail.com'
on conflict (id) do update
set
  email = excluded.email,
  nickname = coalesce(existing_profile.nickname, excluded.nickname);

insert into public.owned_items (user_id, item_id, acquired_at, source)
select id, 'premium-peaceminusone-cap', timezone('utc', now()), 'gallery_seed'
from auth.users
where lower(email) = 'jeniusokg@gmail.com'
on conflict do nothing;

insert into public.auction_participations (user_id, item_id, status, current_bid)
select id, seed.item_id, seed.status, seed.current_bid
from auth.users
cross join (
  values
    ('premium-peaceminusone-cap', 'leading', 52000000::numeric),
    ('hybrid-recruiter-suit', 'outbid', 8400000::numeric)
) as seed(item_id, status, current_bid)
where lower(email) = 'jeniusokg@gmail.com'
on conflict (user_id, item_id) do update
set
  status = excluded.status,
  current_bid = excluded.current_bid;

insert into public.viewed_items (user_id, item_id, viewed_at)
select id, seed.item_id, timezone('utc', now()) - seed.offset_value
from auth.users
cross join (
  values
    ('hybrid-burberry-trench', interval '2 hours'),
    ('hybrid-squid-mask', interval '5 hours'),
    ('hybrid-human-made-tee', interval '1 day')
) as seed(item_id, offset_value)
where lower(email) = 'jeniusokg@gmail.com'
on conflict (user_id, item_id) do update
set viewed_at = excluded.viewed_at;
