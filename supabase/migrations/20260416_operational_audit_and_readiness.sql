-- Krunch operational audit and readiness layer
-- Practical goal:
-- - leave a service-grade trail of who changed what
-- - expose readiness state in SQL for ops workflows
-- - add lightweight operational functions without forcing full event sourcing

begin;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists audit_logs_entity_created_at_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create index if not exists audit_logs_actor_created_at_idx
  on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

create index if not exists audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_metadata_gin_idx
  on public.audit_logs
  using gin (metadata jsonb_path_ops);

alter table public.audit_logs enable row level security;

create or replace function public.krunch_current_actor_user_id()
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  raw_actor_id text;
begin
  raw_actor_id := nullif(current_setting('request.jwt.claim.sub', true), '');

  if raw_actor_id is null then
    return null;
  end if;

  if raw_actor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return raw_actor_id::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.krunch_current_actor_role()
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('role', true), ''),
    'system'
  )
$$;

create or replace function public.krunch_jsonb_changed_fields(before_data jsonb, after_data jsonb)
returns text[]
language sql
immutable
as $$
  with before_items as (
    select key, value
    from jsonb_each(coalesce(before_data, '{}'::jsonb))
  ),
  after_items as (
    select key, value
    from jsonb_each(coalesce(after_data, '{}'::jsonb))
  ),
  changed_keys as (
    select coalesce(after_items.key, before_items.key) as key
    from before_items
    full outer join after_items
      on after_items.key = before_items.key
    where before_items.value is distinct from after_items.value
  )
  select coalesce(array_agg(key order by key), '{}'::text[])
  from changed_keys
$$;

create or replace function public.krunch_insert_audit_log(
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_before_data jsonb default null,
  p_after_data jsonb default null,
  p_actor_user_id uuid default null,
  p_actor_role text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_log_id uuid;
begin
  insert into public.audit_logs (
    actor_user_id,
    actor_role,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data,
    metadata
  )
  values (
    coalesce(p_actor_user_id, public.krunch_current_actor_user_id()),
    coalesce(nullif(p_actor_role, ''), public.krunch_current_actor_role()),
    p_entity_type,
    p_entity_id,
    p_action,
    p_before_data,
    p_after_data,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_log_id;

  return new_log_id;
end;
$$;

create or replace function public.krunch_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  before_payload jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  after_payload jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  changed_fields text[] := public.krunch_jsonb_changed_fields(before_payload, after_payload);
  entity_type_value text;
  entity_id_value text;
  action_value text;
  metadata_value jsonb;
begin
  if coalesce(current_setting('krunch.audit.suppress', true), '0') = '1' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  entity_type_value := case tg_table_name
    when 'provenance_artifacts' then 'artifact'
    when 'auctions' then 'auction'
    when 'certificates' then 'certificate'
    when 'ownership_chain' then 'ownership'
    when 'product_shipping_info' then 'shipping'
    when 'product_shipping_profiles' then 'shipping_profile'
    when 'product_customs_info' then 'customs'
    else tg_table_name
  end;

  entity_id_value := coalesce(
    after_payload ->> 'id',
    after_payload ->> 'auction_id',
    after_payload ->> 'ownership_id',
    after_payload ->> 'artifact_id',
    after_payload ->> 'shipping_profile_code',
    before_payload ->> 'id',
    before_payload ->> 'auction_id',
    before_payload ->> 'ownership_id',
    before_payload ->> 'artifact_id',
    before_payload ->> 'shipping_profile_code'
  );

  action_value := case tg_op
    when 'INSERT' then
      case
        when tg_table_name = 'certificates' then 'issue_certificate'
        else 'create'
      end
    when 'DELETE' then 'delete'
    when 'UPDATE' then
      case
        when tg_table_name = 'provenance_artifacts'
          and (before_payload ->> 'current_status') is distinct from (after_payload ->> 'current_status')
          and (after_payload ->> 'current_status') = 'archived'
          then 'archive'
        when tg_table_name = 'product_shipping_info'
          and (before_payload ->> 'international_sale_status') is distinct from (after_payload ->> 'international_sale_status')
          and (after_payload ->> 'international_sale_status') = 'international_ready'
          then 'mark_international_ready'
        when tg_table_name in ('provenance_artifacts', 'auctions', 'certificates', 'product_shipping_info')
          and (
            (before_payload ->> 'current_status') is distinct from (after_payload ->> 'current_status')
            or (before_payload ->> 'auction_status') is distinct from (after_payload ->> 'auction_status')
            or (before_payload ->> 'status') is distinct from (after_payload ->> 'status')
            or (before_payload ->> 'international_sale_status') is distinct from (after_payload ->> 'international_sale_status')
          )
          then 'change_status'
        else 'update'
      end
  end;

  metadata_value := jsonb_strip_nulls(
    jsonb_build_object(
      'table_name', tg_table_name,
      'operation', tg_op,
      'changed_fields', to_jsonb(coalesce(changed_fields, '{}'::text[])),
      'status_changes', jsonb_strip_nulls(
        jsonb_build_object(
          'current_status', case
            when (before_payload ->> 'current_status') is distinct from (after_payload ->> 'current_status')
              then jsonb_build_array(before_payload ->> 'current_status', after_payload ->> 'current_status')
          end,
          'auction_status', case
            when (before_payload ->> 'auction_status') is distinct from (after_payload ->> 'auction_status')
              then jsonb_build_array(before_payload ->> 'auction_status', after_payload ->> 'auction_status')
          end,
          'certificate_status', case
            when (before_payload ->> 'status') is distinct from (after_payload ->> 'status')
              then jsonb_build_array(before_payload ->> 'status', after_payload ->> 'status')
          end,
          'international_sale_status', case
            when (before_payload ->> 'international_sale_status') is distinct from (after_payload ->> 'international_sale_status')
              then jsonb_build_array(before_payload ->> 'international_sale_status', after_payload ->> 'international_sale_status')
          end
        )
      )
    )
  );

  perform public.krunch_insert_audit_log(
    entity_type_value,
    coalesce(entity_id_value, 'unknown'),
    action_value,
    before_payload,
    after_payload,
    null,
    null,
    metadata_value
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists krunch_audit_provenance_artifacts_trg on public.provenance_artifacts;
create trigger krunch_audit_provenance_artifacts_trg
after insert or update or delete on public.provenance_artifacts
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_auctions_trg on public.auctions;
create trigger krunch_audit_auctions_trg
after insert or update or delete on public.auctions
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_certificates_trg on public.certificates;
create trigger krunch_audit_certificates_trg
after insert or update or delete on public.certificates
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_ownership_chain_trg on public.ownership_chain;
create trigger krunch_audit_ownership_chain_trg
after insert or update or delete on public.ownership_chain
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_product_shipping_info_trg on public.product_shipping_info;
create trigger krunch_audit_product_shipping_info_trg
after insert or update or delete on public.product_shipping_info
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_product_shipping_profiles_trg on public.product_shipping_profiles;
create trigger krunch_audit_product_shipping_profiles_trg
after insert or update or delete on public.product_shipping_profiles
for each row
execute function public.krunch_audit_row_change();

drop trigger if exists krunch_audit_product_customs_info_trg on public.product_customs_info;
create trigger krunch_audit_product_customs_info_trg
after insert or update or delete on public.product_customs_info
for each row
execute function public.krunch_audit_row_change();

create or replace function public.krunch_artifact_readiness_snapshot(p_artifact_id uuid)
returns table (
  artifact_id uuid,
  artifact_code text,
  artifact_title text,
  artifact_status text,
  public_visibility text,
  shipping_info_status text,
  customs_info_status text,
  international_sale_status text,
  manual_review_required boolean,
  shipping_profile_code text,
  effective_package_type text,
  effective_package_weight_grams integer,
  ddp_mode text,
  country_of_origin text,
  effective_hs_code text,
  public_media_count integer,
  is_shipping_ready boolean,
  is_customs_ready boolean,
  can_mark_international_ready boolean,
  is_international_ready boolean,
  is_listing_ready boolean,
  shipping_missing_requirements text[],
  customs_missing_requirements text[],
  listing_missing_requirements text[],
  shipping_missing_requirements_count integer,
  customs_missing_requirements_count integer,
  listing_missing_requirements_count integer,
  missing_requirements_count integer,
  missing_requirements_summary text
)
language plpgsql
stable
set search_path = public
as $$
declare
  artifact_row public.provenance_artifacts%rowtype;
  shipping_row public.product_shipping_info%rowtype;
  profile_row public.product_shipping_profiles%rowtype;
  customs_row public.product_customs_info%rowtype;
  public_media_total integer := 0;
  shipping_missing text[] := '{}'::text[];
  customs_missing text[] := '{}'::text[];
  listing_missing text[] := '{}'::text[];
  combined_missing text[] := '{}'::text[];
  shipping_ready boolean := false;
  customs_ready boolean := false;
  can_mark_ready boolean := false;
  international_ready boolean := false;
  listing_ready boolean := false;
  effective_package_type_value text;
  effective_weight_value integer;
  effective_hs_code_value text;
begin
  select *
  into artifact_row
  from public.provenance_artifacts
  where id = p_artifact_id;

  if not found then
    return;
  end if;

  select *
  into shipping_row
  from public.product_shipping_info
  where artifact_id = p_artifact_id;

  if shipping_row.shipping_profile_code is not null then
    select *
    into profile_row
    from public.product_shipping_profiles
    where shipping_profile_code = shipping_row.shipping_profile_code;
  end if;

  select *
  into customs_row
  from public.product_customs_info
  where artifact_id = p_artifact_id;

  select count(*)::integer
  into public_media_total
  from public.media_assets
  where artifact_id = p_artifact_id
    and coalesce(visibility_level, 'internal_only') in ('public', 'collector_only', 'internal_only');

  effective_package_type_value := coalesce(shipping_row.package_type, profile_row.package_type);
  effective_weight_value := coalesce(shipping_row.estimated_package_weight_grams, profile_row.estimated_package_weight_grams);
  effective_hs_code_value := coalesce(nullif(customs_row.hs_code_global_6, ''), nullif(customs_row.hs_code_local, ''));

  shipping_missing := array_remove(array[
    case
      when nullif(coalesce(shipping_row.shipping_profile_code, ''), '') is null
        and nullif(coalesce(effective_package_type_value, ''), '') is null
        then 'Shipping Profile or Package Type'
    end,
    case
      when coalesce(effective_weight_value, 0) <= 0
        then 'Estimated Package Weight'
    end,
    case
      when nullif(coalesce(shipping_row.ddp_mode, ''), '') is null
        then 'DDP Mode'
    end
  ], null)::text[];

  customs_missing := array_remove(array[
    case
      when nullif(coalesce(customs_row.customs_product_name_en, ''), '') is null
        then 'Customs Product Name (EN)'
    end,
    case
      when nullif(coalesce(effective_hs_code_value, ''), '') is null
        then 'HS Code'
    end,
    case
      when nullif(coalesce(customs_row.country_of_origin, ''), '') is null
        then 'Country of Origin'
    end
  ], null)::text[];

  listing_missing := array_remove(array[
    case
      when nullif(coalesce(artifact_row.artifact_code, ''), '') is null
        then 'Artifact Code'
    end,
    case
      when nullif(coalesce(artifact_row.artifact_title, ''), '') is null
        then 'Artifact Title'
    end,
    case
      when nullif(coalesce(artifact_row.artifact_type, ''), '') is null
        then 'Artifact Type'
    end,
    case
      when nullif(coalesce(artifact_row.usage_tier, ''), '') is null
        then 'Usage Tier'
    end,
    case
      when nullif(coalesce(artifact_row.public_visibility, ''), '') is null
        then 'Visibility Level'
    end,
    case
      when public_media_total <= 0
        then 'Media Asset'
    end,
    case
      when coalesce(artifact_row.current_status, 'draft') in ('draft', 'archived', 'disputed', 'retired')
        then 'Listing-Friendly Status'
    end
  ], null)::text[];

  shipping_ready := cardinality(shipping_missing) = 0;
  customs_ready := cardinality(customs_missing) = 0;
  can_mark_ready := shipping_ready
    and customs_ready
    and coalesce(shipping_row.manual_review_required, false) = false;
  international_ready := can_mark_ready
    and coalesce(shipping_row.international_sale_status, 'draft') = 'international_ready';
  listing_ready := cardinality(listing_missing) = 0;

  select coalesce(array_agg(distinct requirement order by requirement), '{}'::text[])
  into combined_missing
  from unnest(
    coalesce(shipping_missing, '{}'::text[])
    || coalesce(customs_missing, '{}'::text[])
    || coalesce(listing_missing, '{}'::text[])
  ) as requirement;

  return query
  select
    artifact_row.id,
    artifact_row.artifact_code,
    artifact_row.artifact_title,
    artifact_row.current_status,
    artifact_row.public_visibility,
    coalesce(shipping_row.shipping_info_status, 'empty'),
    coalesce(customs_row.customs_info_status, 'empty'),
    coalesce(shipping_row.international_sale_status, 'draft'),
    coalesce(shipping_row.manual_review_required, false),
    shipping_row.shipping_profile_code,
    effective_package_type_value,
    effective_weight_value,
    shipping_row.ddp_mode,
    customs_row.country_of_origin,
    effective_hs_code_value,
    public_media_total,
    shipping_ready,
    customs_ready,
    can_mark_ready,
    international_ready,
    listing_ready,
    shipping_missing,
    customs_missing,
    listing_missing,
    cardinality(shipping_missing),
    cardinality(customs_missing),
    cardinality(listing_missing),
    cardinality(combined_missing),
    nullif(array_to_string(combined_missing, ', '), '');
end;
$$;

create or replace function public.is_shipping_ready(p_artifact_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select is_shipping_ready
     from public.krunch_artifact_readiness_snapshot(p_artifact_id)),
    false
  )
$$;

create or replace function public.is_customs_ready(p_artifact_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select is_customs_ready
     from public.krunch_artifact_readiness_snapshot(p_artifact_id)),
    false
  )
$$;

create or replace function public.is_international_ready(p_artifact_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select is_international_ready
     from public.krunch_artifact_readiness_snapshot(p_artifact_id)),
    false
  )
$$;

create or replace function public.is_listing_ready(p_artifact_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select is_listing_ready
     from public.krunch_artifact_readiness_snapshot(p_artifact_id)),
    false
  )
$$;

create or replace function public.can_mark_international_ready(p_artifact_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select can_mark_international_ready
     from public.krunch_artifact_readiness_snapshot(p_artifact_id)),
    false
  )
$$;

create or replace view public.artifact_readiness_view
with (security_invoker = true)
as
select
  artifact.id as artifact_id,
  artifact.artifact_code,
  artifact.artifact_title,
  artifact.artist_name,
  artifact.group_name,
  artifact.agency_name,
  readiness.artifact_status,
  readiness.public_visibility,
  readiness.shipping_info_status,
  readiness.customs_info_status,
  readiness.international_sale_status,
  readiness.manual_review_required,
  readiness.shipping_profile_code,
  readiness.effective_package_type,
  readiness.effective_package_weight_grams,
  readiness.ddp_mode,
  readiness.country_of_origin,
  readiness.effective_hs_code,
  readiness.public_media_count,
  readiness.is_shipping_ready,
  readiness.is_customs_ready,
  readiness.can_mark_international_ready,
  readiness.is_international_ready,
  readiness.is_listing_ready,
  readiness.shipping_missing_requirements_count,
  readiness.customs_missing_requirements_count,
  readiness.listing_missing_requirements_count,
  readiness.missing_requirements_count,
  readiness.missing_requirements_summary,
  readiness.shipping_missing_requirements,
  readiness.customs_missing_requirements,
  readiness.listing_missing_requirements,
  artifact.updated_at
from public.provenance_artifacts as artifact
cross join lateral public.krunch_artifact_readiness_snapshot(artifact.id) as readiness;

create or replace view public.current_ownership_view
with (security_invoker = true)
as
with ranked_ownership as (
  select
    ownership.ownership_id,
    ownership.artifact_id,
    artifact.artifact_code,
    artifact.artifact_title,
    artifact.artist_name,
    ownership.owner_type,
    ownership.owner_name,
    ownership.is_current_owner,
    ownership.ownership_start_date,
    ownership.ownership_end_date,
    ownership.acquisition_method,
    ownership.acquisition_price,
    ownership.currency,
    ownership.transfer_reference,
    ownership.settlement_reference,
    ownership.visibility_level,
    ownership.notes,
    ownership.created_at,
    ownership.updated_at,
    row_number() over (
      partition by ownership.artifact_id
      order by
        ownership.is_current_owner desc,
        ownership.ownership_end_date nulls first,
        ownership.ownership_start_date desc nulls last,
        ownership.created_at desc
    ) as row_num
  from public.ownership_chain as ownership
  join public.provenance_artifacts as artifact
    on artifact.id = ownership.artifact_id
)
select
  ownership_id,
  artifact_id,
  artifact_code,
  artifact_title,
  artist_name,
  owner_type,
  owner_name,
  is_current_owner,
  ownership_start_date,
  ownership_end_date,
  acquisition_method,
  acquisition_price,
  currency,
  transfer_reference,
  settlement_reference,
  visibility_level,
  notes,
  created_at,
  updated_at
from ranked_ownership
where row_num = 1
  and is_current_owner is true;

create or replace view public.auction_summary_view
with (security_invoker = true)
as
with bid_rollup as (
  select
    auction_id,
    count(*)::integer as bid_count,
    max(bid_amount) as highest_bid_amount,
    max(bid_time) as latest_bid_time
  from public.bid_history
  group by auction_id
)
select
  auction.auction_id,
  auction.artifact_id,
  artifact.artifact_code,
  artifact.artifact_title,
  artifact.artist_name,
  auction.auction_title,
  auction.auction_type,
  auction.auction_status,
  auction.settlement_status,
  auction.lot_number,
  auction.currency,
  auction.opening_bid,
  auction.reserve_price,
  auction.hammer_price,
  auction.final_price,
  auction.auction_start_time,
  auction.auction_end_time,
  coalesce(bids.bid_count, 0) as bid_count,
  bids.highest_bid_amount,
  bids.latest_bid_time,
  (auction.auction_status in ('scheduled', 'live')) as is_auction_open,
  case
    when auction.auction_status = 'live' and coalesce(bids.bid_count, 0) = 0 then 'Awaiting first bid'
    when auction.auction_status = 'live' then 'Bidding active'
    when auction.auction_status = 'ended' then 'Awaiting settlement'
    when auction.auction_status = 'settled' then 'Settlement completed'
    when auction.auction_status = 'cancelled' then 'Auction cancelled'
    else 'Draft configuration'
  end as operational_summary,
  auction.created_at,
  auction.updated_at
from public.auctions as auction
join public.provenance_artifacts as artifact
  on artifact.id = auction.artifact_id
left join bid_rollup as bids
  on bids.auction_id = auction.auction_id;

create or replace view public.international_sale_candidates_view
with (security_invoker = true)
as
select
  readiness.artifact_id,
  readiness.artifact_code,
  readiness.artifact_title,
  readiness.artist_name,
  readiness.group_name,
  readiness.artifact_status,
  readiness.public_visibility,
  readiness.shipping_info_status,
  readiness.customs_info_status,
  readiness.international_sale_status,
  readiness.manual_review_required,
  readiness.is_shipping_ready,
  readiness.is_customs_ready,
  readiness.can_mark_international_ready,
  readiness.is_international_ready,
  readiness.shipping_missing_requirements_count + readiness.customs_missing_requirements_count as missing_requirements_count,
  nullif(
    array_to_string(
      (
        select coalesce(array_agg(distinct requirement order by requirement), '{}'::text[])
        from unnest(
          coalesce(readiness.shipping_missing_requirements, '{}'::text[])
          || coalesce(readiness.customs_missing_requirements, '{}'::text[])
        ) as requirement
      ),
      ', '
    ),
    ''
  ) as missing_requirements_summary,
  case
    when readiness.is_international_ready then 'already_ready'
    when readiness.can_mark_international_ready then 'ready_now'
    when readiness.manual_review_required then 'blocked_by_manual_review'
    else 'needs_data'
  end as candidate_state,
  readiness.updated_at
from public.artifact_readiness_view as readiness
where coalesce(readiness.artifact_status, 'draft') not in ('archived', 'retired', 'disputed', 'sold');

create or replace function public.mark_international_ready(
  p_artifact_id uuid,
  p_actor_user_id uuid default null
)
returns public.product_shipping_info
language plpgsql
set search_path = public
as $$
declare
  shipping_before public.product_shipping_info%rowtype;
  shipping_after public.product_shipping_info%rowtype;
  readiness_row public.artifact_readiness_view%rowtype;
begin
  select *
  into readiness_row
  from public.artifact_readiness_view
  where artifact_id = p_artifact_id;

  if not found then
    raise exception 'Artifact % not found.', p_artifact_id;
  end if;

  if readiness_row.can_mark_international_ready is not true then
    raise exception 'Cannot mark international ready. Missing: %',
      coalesce(readiness_row.missing_requirements_summary, 'requirements missing');
  end if;

  select *
  into shipping_before
  from public.product_shipping_info
  where artifact_id = p_artifact_id;

  if not found then
    raise exception 'Shipping info row is required before marking international ready.';
  end if;

  perform set_config('krunch.audit.suppress', '1', true);

  update public.product_shipping_info
  set
    shipping_info_status = 'complete',
    international_sale_status = 'international_ready',
    manual_review_required = false,
    updated_at = timezone('utc'::text, now())
  where artifact_id = p_artifact_id
  returning * into shipping_after;

  perform set_config('krunch.audit.suppress', '0', true);

  perform public.krunch_insert_audit_log(
    'shipping',
    p_artifact_id::text,
    'mark_international_ready',
    to_jsonb(shipping_before),
    to_jsonb(shipping_after),
    p_actor_user_id,
    null,
    jsonb_build_object(
      'artifact_id', p_artifact_id,
      'operation', 'mark_international_ready'
    )
  );

  return shipping_after;
exception
  when others then
    perform set_config('krunch.audit.suppress', '0', true);
    raise;
end;
$$;

create or replace function public.issue_certificate(
  p_artifact_id uuid,
  p_certificate_code text,
  p_certificate_type text default 'krunch_certified',
  p_auth_id uuid default null,
  p_actor_user_id uuid default null,
  p_public_url text default null,
  p_qr_payload text default null
)
returns public.certificates
language plpgsql
set search_path = public
as $$
declare
  artifact_row public.provenance_artifacts%rowtype;
  certificate_row public.certificates%rowtype;
  superseded_count integer := 0;
begin
  select *
  into artifact_row
  from public.provenance_artifacts
  where id = p_artifact_id;

  if not found then
    raise exception 'Artifact % not found.', p_artifact_id;
  end if;

  if nullif(btrim(p_certificate_code), '') is null then
    raise exception 'certificate_code is required.';
  end if;

  perform set_config('krunch.audit.suppress', '1', true);

  update public.certificates
  set status = 'superseded'
  where artifact_id = p_artifact_id
    and status = 'active';

  get diagnostics superseded_count = row_count;

  insert into public.certificates (
    owner_user_id,
    certificate_id,
    artifact_id,
    auth_id,
    certificate_code,
    certificate_type,
    issued_at,
    status,
    public_url,
    qr_payload
  )
  values (
    artifact_row.owner_user_id,
    upper(replace(gen_random_uuid()::text, '-', '')),
    p_artifact_id,
    p_auth_id,
    btrim(p_certificate_code),
    coalesce(nullif(btrim(p_certificate_type), ''), 'krunch_certified'),
    timezone('utc'::text, now()),
    'active',
    nullif(btrim(p_public_url), ''),
    nullif(btrim(p_qr_payload), '')
  )
  returning * into certificate_row;

  perform set_config('krunch.audit.suppress', '0', true);

  perform public.krunch_insert_audit_log(
    'certificate',
    certificate_row.id::text,
    'issue_certificate',
    null,
    to_jsonb(certificate_row),
    p_actor_user_id,
    null,
    jsonb_build_object(
      'artifact_id', p_artifact_id,
      'superseded_certificate_count', superseded_count
    )
  );

  return certificate_row;
exception
  when others then
    perform set_config('krunch.audit.suppress', '0', true);
    raise;
end;
$$;

create or replace function public.archive_artifact(
  p_artifact_id uuid,
  p_actor_user_id uuid default null,
  p_reason text default null
)
returns public.provenance_artifacts
language plpgsql
set search_path = public
as $$
declare
  artifact_before public.provenance_artifacts%rowtype;
  artifact_after public.provenance_artifacts%rowtype;
begin
  select *
  into artifact_before
  from public.provenance_artifacts
  where id = p_artifact_id;

  if not found then
    raise exception 'Artifact % not found.', p_artifact_id;
  end if;

  perform set_config('krunch.audit.suppress', '1', true);

  update public.provenance_artifacts
  set
    current_status = 'archived',
    updated_at = timezone('utc'::text, now())
  where id = p_artifact_id
  returning * into artifact_after;

  perform set_config('krunch.audit.suppress', '0', true);

  perform public.krunch_insert_audit_log(
    'artifact',
    p_artifact_id::text,
    'archive',
    to_jsonb(artifact_before),
    to_jsonb(artifact_after),
    p_actor_user_id,
    null,
    jsonb_build_object(
      'reason', nullif(btrim(p_reason), ''),
      'operation', 'archive_artifact'
    )
  );

  return artifact_after;
exception
  when others then
    perform set_config('krunch.audit.suppress', '0', true);
    raise;
end;
$$;

create or replace function public.close_auction(
  p_auction_id uuid,
  p_actor_user_id uuid default null,
  p_closing_reason text default null,
  p_hammer_price numeric default null,
  p_final_price numeric default null
)
returns public.auctions
language plpgsql
set search_path = public
as $$
declare
  auction_before public.auctions%rowtype;
  auction_after public.auctions%rowtype;
begin
  select *
  into auction_before
  from public.auctions
  where auction_id = p_auction_id;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
  end if;

  if coalesce(auction_before.auction_status, 'draft') in ('settled', 'cancelled') then
    raise exception 'Auction % cannot be closed from status %.', p_auction_id, auction_before.auction_status;
  end if;

  perform set_config('krunch.audit.suppress', '1', true);

  update public.auctions
  set
    auction_status = 'ended',
    settlement_status = coalesce(settlement_status, 'pending'),
    auction_end_time = coalesce(auction_end_time, timezone('utc'::text, now())),
    closing_reason = coalesce(nullif(btrim(p_closing_reason), ''), closing_reason),
    hammer_price = coalesce(p_hammer_price, hammer_price),
    final_price = coalesce(p_final_price, final_price),
    updated_at = timezone('utc'::text, now())
  where auction_id = p_auction_id
  returning * into auction_after;

  perform set_config('krunch.audit.suppress', '0', true);

  perform public.krunch_insert_audit_log(
    'auction',
    p_auction_id::text,
    'change_status',
    to_jsonb(auction_before),
    to_jsonb(auction_after),
    p_actor_user_id,
    null,
    jsonb_build_object(
      'operation', 'close_auction',
      'previous_status', auction_before.auction_status,
      'next_status', auction_after.auction_status
    )
  );

  return auction_after;
exception
  when others then
    perform set_config('krunch.audit.suppress', '0', true);
    raise;
end;
$$;

comment on table public.audit_logs is
  'Operational audit trail for Krunch registry, auction, ownership, shipping, customs, and certificate changes.';

comment on function public.krunch_artifact_readiness_snapshot(uuid) is
  'Returns operational readiness fields and missing requirements for a single artifact.';

comment on function public.can_mark_international_ready(uuid) is
  'Example: select public.can_mark_international_ready(''00000000-0000-0000-0000-000000000000''::uuid);';

comment on function public.mark_international_ready(uuid, uuid) is
  'Example: select public.mark_international_ready(''artifact-uuid''::uuid, ''actor-uuid''::uuid);';

comment on function public.issue_certificate(uuid, text, text, uuid, uuid, text, text) is
  'Issues a new active certificate, supersedes older active certificates for the artifact, and writes an audit log.';

comment on function public.archive_artifact(uuid, uuid, text) is
  'Archives an artifact and writes a semantic audit log entry.';

comment on function public.close_auction(uuid, uuid, text, numeric, numeric) is
  'Closes an auction into ended status and writes a semantic audit log entry.';

commit;
