create table if not exists public.provenance_artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  artifact_code text not null,
  artifact_title text not null,
  artifact_type text not null,
  artist_name text,
  group_name text,
  agency_name text,
  era_name text,
  estimated_year integer,
  first_documented_usage text,
  usage_tier text check (usage_tier in ('BLACK', 'PINK')),
  is_custom_made boolean,
  is_stage_used boolean,
  is_screen_used boolean,
  material_summary text,
  size_info text,
  colorway text,
  current_status text check (current_status in ('archived', 'in_storage', 'on_auction', 'sold', 'retired')),
  current_holder text,
  storage_location text,
  public_visibility text check (public_visibility in ('public', 'collector_only', 'internal_only')),
  created_at date,
  internal_notes text,
  unique (owner_user_id, artifact_code)
);

create index if not exists provenance_artifacts_owner_user_id_idx
on public.provenance_artifacts (owner_user_id);

create table if not exists public.provenance_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  artifact_code text not null,
  event_type text check (event_type in ('created', 'fitted', 'stage_used', 'broadcast_used', 'tour_used', 'photographed', 'authenticated', 'transferred', 'auctioned', 'exhibited')),
  event_title text,
  event_date_start date,
  event_date_end date,
  event_location text,
  artist_name text,
  stylist_name text,
  production_entity text,
  source_confidence text check (source_confidence in ('confirmed', 'probable', 'internal_only')),
  evidence_summary text,
  media_link text,
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  internal_notes text,
  unique (owner_user_id, event_id),
  constraint provenance_events_artifact_fkey
    foreign key (owner_user_id, artifact_code)
    references public.provenance_artifacts (owner_user_id, artifact_code)
    on delete cascade
);

create index if not exists provenance_events_owner_user_id_idx
on public.provenance_events (owner_user_id);

create index if not exists provenance_events_artifact_code_idx
on public.provenance_events (owner_user_id, artifact_code);

create table if not exists public.provenance_authentications (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  auth_id text not null,
  artifact_code text not null,
  auth_method text check (auth_method in ('dna', 'ucnp', 'nfc', 'visual', 'document', 'stylist_confirmation', 'agency_confirmation', 'external_expert')),
  auth_result text check (auth_result in ('verified', 'partially_verified', 'inconclusive', 'failed')),
  auth_date date,
  auth_provider text,
  forensic_ref text,
  certificate_code text,
  expiry_date text,
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  notes text,
  unique (owner_user_id, auth_id),
  constraint provenance_authentications_artifact_fkey
    foreign key (owner_user_id, artifact_code)
    references public.provenance_artifacts (owner_user_id, artifact_code)
    on delete cascade
);

create index if not exists provenance_authentications_owner_user_id_idx
on public.provenance_authentications (owner_user_id);

create index if not exists provenance_authentications_artifact_code_idx
on public.provenance_authentications (owner_user_id, artifact_code);

create table if not exists public.provenance_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id text not null,
  artifact_code text not null,
  transaction_type text check (transaction_type in ('primary_auction', 'secondary_sale', 'private_sale', 'consignment_sale', 'transfer')),
  sale_title text,
  listing_date date,
  close_date date,
  opening_bid numeric,
  reserve_price numeric,
  hammer_price numeric,
  final_price numeric,
  buyer_fee_rate text,
  seller_fee_rate text,
  winner_name text,
  settlement_status text check (settlement_status in ('pending', 'settled', 'failed', 'refunded')),
  visibility_level text check (visibility_level in ('public', 'collector_only', 'internal_only')),
  notes text,
  unique (owner_user_id, transaction_id),
  constraint provenance_transactions_artifact_fkey
    foreign key (owner_user_id, artifact_code)
    references public.provenance_artifacts (owner_user_id, artifact_code)
    on delete cascade
);

create index if not exists provenance_transactions_owner_user_id_idx
on public.provenance_transactions (owner_user_id);

create index if not exists provenance_transactions_artifact_code_idx
on public.provenance_transactions (owner_user_id, artifact_code);

alter table public.provenance_artifacts enable row level security;
alter table public.provenance_events enable row level security;
alter table public.provenance_authentications enable row level security;
alter table public.provenance_transactions enable row level security;

drop policy if exists "provenance_artifacts_select_own" on public.provenance_artifacts;
drop policy if exists "provenance_artifacts_insert_own" on public.provenance_artifacts;
drop policy if exists "provenance_artifacts_update_own" on public.provenance_artifacts;
drop policy if exists "provenance_events_select_own" on public.provenance_events;
drop policy if exists "provenance_events_insert_own" on public.provenance_events;
drop policy if exists "provenance_events_update_own" on public.provenance_events;
drop policy if exists "provenance_authentications_select_own" on public.provenance_authentications;
drop policy if exists "provenance_authentications_insert_own" on public.provenance_authentications;
drop policy if exists "provenance_authentications_update_own" on public.provenance_authentications;
drop policy if exists "provenance_transactions_select_own" on public.provenance_transactions;
drop policy if exists "provenance_transactions_insert_own" on public.provenance_transactions;
drop policy if exists "provenance_transactions_update_own" on public.provenance_transactions;

create policy "provenance_artifacts_select_own"
on public.provenance_artifacts
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "provenance_artifacts_insert_own"
on public.provenance_artifacts
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "provenance_artifacts_update_own"
on public.provenance_artifacts
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "provenance_events_select_own"
on public.provenance_events
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "provenance_events_insert_own"
on public.provenance_events
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "provenance_events_update_own"
on public.provenance_events
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "provenance_authentications_select_own"
on public.provenance_authentications
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "provenance_authentications_insert_own"
on public.provenance_authentications
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "provenance_authentications_update_own"
on public.provenance_authentications
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "provenance_transactions_select_own"
on public.provenance_transactions
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "provenance_transactions_insert_own"
on public.provenance_transactions
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "provenance_transactions_update_own"
on public.provenance_transactions
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);
