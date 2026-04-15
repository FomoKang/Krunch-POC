create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.provenance_artifacts
  add column if not exists artist_group text,
  add column if not exists primary_event text,
  add column if not exists primary_provenance_event_id uuid,
  add column if not exists event_year integer,
  add column if not exists description text,
  add column if not exists physical_description text,
  add column if not exists material text,
  add column if not exists color text,
  add column if not exists rarity_tier text,
  add column if not exists current_owner_name text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.provenance_artifacts
set
  artist_group = coalesce(artist_group, group_name),
  primary_event = coalesce(primary_event, first_documented_usage),
  event_year = coalesce(event_year, estimated_year),
  description = coalesce(description, first_documented_usage),
  material = coalesce(material, material_summary),
  color = coalesce(color, colorway),
  current_owner_name = coalesce(current_owner_name, current_holder),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where
  artist_group is null
  or primary_event is null
  or event_year is null
  or description is null
  or material is null
  or color is null
  or current_owner_name is null;

alter table public.provenance_artifacts
  drop constraint if exists provenance_artifacts_current_status_check;

alter table public.provenance_artifacts
  add constraint provenance_artifacts_current_status_check
  check (current_status in ('archived', 'in_storage', 'on_auction', 'sold', 'retired', 'disputed'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provenance_artifacts_rarity_tier_check'
  ) then
    alter table public.provenance_artifacts
      add constraint provenance_artifacts_rarity_tier_check
      check (rarity_tier in ('unique', 'highly_limited', 'limited', 'replicated'));
  end if;
end
$$;

alter table public.provenance_events
  add column if not exists artifact_id uuid,
  add column if not exists event_sequence integer,
  add column if not exists agency_name text,
  add column if not exists stylist_id uuid,
  add column if not exists production_entity_id uuid,
  add column if not exists location text,
  add column if not exists description text,
  add column if not exists media_reference text,
  add column if not exists linked_auth_id uuid,
  add column if not exists is_primary_event boolean default false,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.provenance_events pe
set artifact_id = pa.id
from public.provenance_artifacts pa
where
  pe.artifact_id is null
  and pe.owner_user_id = pa.owner_user_id
  and pe.artifact_code = pa.artifact_code;

with ranked_events as (
  select
    id,
    row_number() over (
      partition by owner_user_id, artifact_code
      order by event_date_start nulls last, event_date_end nulls last, created_at, event_id
    ) as seq
  from public.provenance_events
),
event_enrichment as (
  select
    pe.id,
    ranked_events.seq,
    pa.agency_name as artifact_agency_name
  from public.provenance_events pe
  join ranked_events on ranked_events.id = pe.id
  left join public.provenance_artifacts pa on pa.id = pe.artifact_id
)
update public.provenance_events pe
set
  event_sequence = coalesce(pe.event_sequence, event_enrichment.seq),
  agency_name = coalesce(pe.agency_name, event_enrichment.artifact_agency_name),
  location = coalesce(pe.location, pe.event_location),
  description = coalesce(pe.description, pe.event_title),
  media_reference = coalesce(pe.media_reference, pe.media_link),
  updated_at = coalesce(pe.updated_at, timezone('utc', now()))
from event_enrichment
where pe.id = event_enrichment.id;

alter table public.provenance_authentications
  add column if not exists artifact_id uuid,
  add column if not exists auth_status text,
  add column if not exists sample_collected_at timestamptz,
  add column if not exists sample_location text,
  add column if not exists forensic_reference text,
  add column if not exists certificate_id text,
  add column if not exists certificate_public_url text,
  add column if not exists verified_by_user uuid references auth.users (id) on delete set null,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.provenance_authentications pauth
set artifact_id = pa.id
from public.provenance_artifacts pa
where
  pauth.artifact_id is null
  and pauth.owner_user_id = pa.owner_user_id
  and pauth.artifact_code = pa.artifact_code;

update public.provenance_authentications
set
  auth_status = coalesce(auth_status, case when auth_result = 'verified' then 'active' else 'pending' end),
  forensic_reference = coalesce(forensic_reference, forensic_ref),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where
  auth_status is null
  or forensic_reference is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provenance_authentications_auth_status_check'
  ) then
    alter table public.provenance_authentications
      add constraint provenance_authentications_auth_status_check
      check (auth_status in ('active', 'pending', 'superseded', 'revoked'));
  end if;
end
$$;

alter table public.provenance_transactions
  add column if not exists artifact_id uuid,
  add column if not exists auction_id uuid,
  add column if not exists currency text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.provenance_transactions pt
set artifact_id = pa.id
from public.provenance_artifacts pa
where
  pt.artifact_id is null
  and pt.owner_user_id = pa.owner_user_id
  and pt.artifact_code = pa.artifact_code;

update public.provenance_transactions
set
  currency = coalesce(currency, 'KRW'),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where
  currency is null;

create table if not exists public.stylists (
  stylist_id uuid primary key default gen_random_uuid(),
  stylist_name text not null,
  public_name text,
  public_credit_name text,
  agency_or_studio text,
  contact_private text,
  is_public_credit_allowed boolean,
  visibility_default text check (visibility_default in ('public', 'collector_only', 'internal_only')),
  risk_flag text check (risk_flag in ('normal', 'sensitive', 'restricted')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ownership_chain (
  ownership_id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.provenance_artifacts (id) on delete cascade,
  owner_type text check (owner_type in ('agency', 'krunch', 'collector', 'museum', 'consignor', 'unknown')),
  owner_entity_id uuid,
  owner_name text,
  ownership_start_date date,
  ownership_end_date date,
  is_current_owner boolean,
  acquisition_method text check (acquisition_method in ('auction', 'direct_purchase', 'transfer', 'gift', 'consignment')),
  acquisition_price numeric,
  currency text,
  transfer_reference text,
  settlement_reference text,
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auctions (
  auction_id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.provenance_artifacts (id) on delete cascade,
  lot_number text,
  auction_title text,
  auction_type text check (auction_type in ('premium', 'hybrid', 'private', 'charity')),
  estimate_low numeric,
  estimate_high numeric,
  reserve_price numeric,
  opening_bid numeric,
  currency text,
  buyer_premium_rate text,
  seller_fee_rate text,
  auction_start_time timestamptz,
  auction_end_time timestamptz,
  auction_status text check (auction_status in ('draft', 'scheduled', 'live', 'closed', 'cancelled', 'settled')),
  settlement_status text check (settlement_status in ('pending', 'completed', 'failed', 'refunded')),
  closing_reason text,
  guarantee_type text check (guarantee_type in ('none', 'house', 'third_party')),
  guarantee_amount numeric,
  hammer_price numeric,
  final_price numeric,
  winner_bidder_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bid_history (
  bid_id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions (auction_id) on delete cascade,
  bidder_id uuid,
  bid_amount numeric not null,
  currency text,
  bid_time timestamptz,
  bid_type text check (bid_type in ('live', 'absentee', 'phone', 'anchor', 'guarantee')),
  bid_source_channel text check (bid_source_channel in ('web', 'app', 'offline', 'admin')),
  auto_bid_max numeric,
  is_anchor_bid boolean,
  is_winning_bid boolean,
  is_valid boolean,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media_assets (
  media_id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.provenance_artifacts (id) on delete cascade,
  provenance_event_id uuid references public.provenance_events (id) on delete set null,
  asset_type text check (asset_type in ('photo', 'video', 'backstage', 'fitting', 'invoice', 'sketch', 'coa_scan')),
  file_url text not null,
  thumbnail_url text,
  file_type text,
  file_hash text,
  caption text,
  source text,
  copyright_status text,
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  sort_order integer,
  is_primary boolean,
  taken_at timestamptz,
  uploaded_at timestamptz not null default timezone('utc', now()),
  uploaded_by uuid references auth.users (id) on delete set null
);

create table if not exists public.disclosure_controls (
  disclosure_id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.provenance_artifacts (id) on delete cascade,
  field_name text check (field_name in ('stylist', 'production_house', 'source_path', 'event_detail')),
  field_value_reference text,
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  reason_code text check (reason_code in ('privacy', 'contractual', 'risk_management', 'reuse_sensitive')),
  status text check (status in ('active', 'expired', 'revoked')),
  approved_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provenance_events_artifact_id_idx
on public.provenance_events (artifact_id);

create index if not exists provenance_authentications_artifact_id_idx
on public.provenance_authentications (artifact_id);

create index if not exists provenance_transactions_artifact_id_idx
on public.provenance_transactions (artifact_id);

create index if not exists provenance_transactions_auction_id_idx
on public.provenance_transactions (auction_id);

create index if not exists provenance_artifacts_primary_provenance_event_id_idx
on public.provenance_artifacts (primary_provenance_event_id);

create index if not exists ownership_chain_artifact_id_idx
on public.ownership_chain (artifact_id);

create index if not exists auctions_artifact_id_idx
on public.auctions (artifact_id);

create index if not exists bid_history_auction_id_idx
on public.bid_history (auction_id);

create index if not exists media_assets_artifact_id_idx
on public.media_assets (artifact_id);

create index if not exists media_assets_provenance_event_id_idx
on public.media_assets (provenance_event_id);

create index if not exists disclosure_controls_artifact_id_idx
on public.disclosure_controls (artifact_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_events_artifact_id_fkey') then
    alter table public.provenance_events
      add constraint provenance_events_artifact_id_fkey
      foreign key (artifact_id)
      references public.provenance_artifacts (id)
      on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_transactions_artifact_id_fkey') then
    alter table public.provenance_transactions
      add constraint provenance_transactions_artifact_id_fkey
      foreign key (artifact_id)
      references public.provenance_artifacts (id)
      on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_artifacts_primary_provenance_event_id_fkey') then
    alter table public.provenance_artifacts
      add constraint provenance_artifacts_primary_provenance_event_id_fkey
      foreign key (primary_provenance_event_id)
      references public.provenance_events (id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_authentications_artifact_id_fkey') then
    alter table public.provenance_authentications
      add constraint provenance_authentications_artifact_id_fkey
      foreign key (artifact_id)
      references public.provenance_artifacts (id)
      on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_events_linked_auth_id_fkey') then
    alter table public.provenance_events
      add constraint provenance_events_linked_auth_id_fkey
      foreign key (linked_auth_id)
      references public.provenance_authentications (id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_events_stylist_id_fkey') then
    alter table public.provenance_events
      add constraint provenance_events_stylist_id_fkey
      foreign key (stylist_id)
      references public.stylists (stylist_id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'provenance_transactions_auction_id_fkey') then
    alter table public.provenance_transactions
      add constraint provenance_transactions_auction_id_fkey
      foreign key (auction_id)
      references public.auctions (auction_id)
      on delete set null;
  end if;
end
$$;

alter table public.stylists enable row level security;
alter table public.ownership_chain enable row level security;
alter table public.auctions enable row level security;
alter table public.bid_history enable row level security;
alter table public.media_assets enable row level security;
alter table public.disclosure_controls enable row level security;

drop policy if exists "stylists_select_own" on public.stylists;
drop policy if exists "stylists_insert_own" on public.stylists;
drop policy if exists "stylists_update_own" on public.stylists;
drop policy if exists "ownership_chain_select_own" on public.ownership_chain;
drop policy if exists "ownership_chain_insert_own" on public.ownership_chain;
drop policy if exists "ownership_chain_update_own" on public.ownership_chain;
drop policy if exists "auctions_select_own" on public.auctions;
drop policy if exists "auctions_insert_own" on public.auctions;
drop policy if exists "auctions_update_own" on public.auctions;
drop policy if exists "bid_history_select_own" on public.bid_history;
drop policy if exists "bid_history_insert_own" on public.bid_history;
drop policy if exists "bid_history_update_own" on public.bid_history;
drop policy if exists "media_assets_select_own" on public.media_assets;
drop policy if exists "media_assets_insert_own" on public.media_assets;
drop policy if exists "media_assets_update_own" on public.media_assets;
drop policy if exists "disclosure_controls_select_own" on public.disclosure_controls;
drop policy if exists "disclosure_controls_insert_own" on public.disclosure_controls;
drop policy if exists "disclosure_controls_update_own" on public.disclosure_controls;

create policy "stylists_select_own"
on public.stylists
for select
to authenticated
using (true);

create policy "stylists_insert_own"
on public.stylists
for insert
to authenticated
with check (true);

create policy "stylists_update_own"
on public.stylists
for update
to authenticated
using (true)
with check (true);

create policy "ownership_chain_select_own"
on public.ownership_chain
for select
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "ownership_chain_insert_own"
on public.ownership_chain
for insert
to authenticated
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "ownership_chain_update_own"
on public.ownership_chain
for update
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "auctions_select_own"
on public.auctions
for select
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "auctions_insert_own"
on public.auctions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "auctions_update_own"
on public.auctions
for update
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "bid_history_select_own"
on public.bid_history
for select
to authenticated
using (
  exists (
    select 1
    from public.auctions a
    join public.provenance_artifacts pa on pa.id = a.artifact_id
    where a.auction_id = bid_history.auction_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "bid_history_insert_own"
on public.bid_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.auctions a
    join public.provenance_artifacts pa on pa.id = a.artifact_id
    where a.auction_id = bid_history.auction_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "bid_history_update_own"
on public.bid_history
for update
to authenticated
using (
  exists (
    select 1
    from public.auctions a
    join public.provenance_artifacts pa on pa.id = a.artifact_id
    where a.auction_id = bid_history.auction_id
      and pa.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.auctions a
    join public.provenance_artifacts pa on pa.id = a.artifact_id
    where a.auction_id = bid_history.auction_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "media_assets_select_own"
on public.media_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "media_assets_insert_own"
on public.media_assets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "media_assets_update_own"
on public.media_assets
for update
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "disclosure_controls_select_own"
on public.disclosure_controls
for select
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "disclosure_controls_insert_own"
on public.disclosure_controls
for insert
to authenticated
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

create policy "disclosure_controls_update_own"
on public.disclosure_controls
for update
to authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provenance_artifacts pa
    where pa.id = artifact_id
      and pa.owner_user_id = auth.uid()
  )
);

drop trigger if exists provenance_artifacts_set_updated_at on public.provenance_artifacts;
create trigger provenance_artifacts_set_updated_at
before update on public.provenance_artifacts
for each row
execute function public.set_updated_at();

drop trigger if exists provenance_events_set_updated_at on public.provenance_events;
create trigger provenance_events_set_updated_at
before update on public.provenance_events
for each row
execute function public.set_updated_at();

drop trigger if exists provenance_authentications_set_updated_at on public.provenance_authentications;
create trigger provenance_authentications_set_updated_at
before update on public.provenance_authentications
for each row
execute function public.set_updated_at();

drop trigger if exists provenance_transactions_set_updated_at on public.provenance_transactions;
create trigger provenance_transactions_set_updated_at
before update on public.provenance_transactions
for each row
execute function public.set_updated_at();

drop trigger if exists stylists_set_updated_at on public.stylists;
create trigger stylists_set_updated_at
before update on public.stylists
for each row
execute function public.set_updated_at();

drop trigger if exists ownership_chain_set_updated_at on public.ownership_chain;
create trigger ownership_chain_set_updated_at
before update on public.ownership_chain
for each row
execute function public.set_updated_at();

drop trigger if exists auctions_set_updated_at on public.auctions;
create trigger auctions_set_updated_at
before update on public.auctions
for each row
execute function public.set_updated_at();

drop trigger if exists disclosure_controls_set_updated_at on public.disclosure_controls;
create trigger disclosure_controls_set_updated_at
before update on public.disclosure_controls
for each row
execute function public.set_updated_at();
