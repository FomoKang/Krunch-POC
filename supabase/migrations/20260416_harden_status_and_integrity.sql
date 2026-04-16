-- Krunch service hardening migration
-- Strategy:
-- 1. Normalize obvious legacy values in-place where it is low risk.
-- 2. Replace loose status checks with named checks on text columns.
-- 3. Add partial unique indexes for invariants that are safe at the DB layer.
-- 4. Keep cross-row and cross-table workflow transitions in the service layer.
--
-- Intentionally not rewritten here:
-- - legacy multi-column artifact_code foreign keys on provenance_events /
--   provenance_authentications / provenance_transactions
-- - live auction bid increment and current-highest-bid rules
-- Those need a wider transactional refactor or service-layer coordination.

begin;

create or replace function public.krunch_is_iso2_country_code(value text)
returns boolean
language sql
immutable
as $$
  select
    value is null
    or btrim(value) = ''
    or upper(btrim(value)) ~ '^[A-Z]{2}$'
$$;

create or replace function public.krunch_are_iso2_country_codes(country_codes text[])
returns boolean
language sql
immutable
as $$
  select not exists (
    select 1
    from unnest(coalesce(country_codes, '{}'::text[])) as code(value)
    where btrim(code.value) <> ''
      and upper(btrim(code.value)) !~ '^[A-Z]{2}$'
  )
$$;

do $$
declare
  constraint_table_name text;
  constraint_name text;
begin
  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'provenance_artifacts'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%current_status%'
        or pg_get_constraintdef(con.oid) ilike '%public_visibility%'
      )
  loop
    execute format('alter table public.provenance_artifacts drop constraint if exists %I', constraint_name);
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'auctions'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%auction_status%'
        or pg_get_constraintdef(con.oid) ilike '%settlement_status%'
      )
  loop
    execute format('alter table public.auctions drop constraint if exists %I', constraint_name);
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'certificates'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%status%'
        or pg_get_constraintdef(con.oid) ilike '%revoked_at%'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', constraint_table_name, constraint_name);
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in (
        'provenance_events',
        'provenance_authentications',
        'media_assets',
        'disclosure_controls',
        'provenance_transactions'
      )
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%visibility_level%'
  loop
    execute format(
      'alter table public.%I drop constraint if exists %I',
      constraint_table_name,
      constraint_name
    );
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'product_shipping_profiles'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%package_type%'
        or pg_get_constraintdef(con.oid) ilike '%carrier_preference%'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', constraint_table_name, constraint_name);
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'product_shipping_info'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%shipping_info_status%'
        or pg_get_constraintdef(con.oid) ilike '%international_sale_status%'
        or pg_get_constraintdef(con.oid) ilike '%package_type%'
        or pg_get_constraintdef(con.oid) ilike '%carrier_preference%'
        or pg_get_constraintdef(con.oid) ilike '%brokerage_fee_policy%'
        or pg_get_constraintdef(con.oid) ilike '%ddp_mode%'
        or pg_get_constraintdef(con.oid) ilike '%customs_risk_tier%'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', constraint_table_name, constraint_name);
  end loop;

  for constraint_table_name, constraint_name in
    select rel.relname, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'product_customs_info'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%customs_info_status%'
  loop
    execute format('alter table public.%I drop constraint if exists %I', constraint_table_name, constraint_name);
  end loop;
end $$;

update public.provenance_artifacts
set
  current_status = case
    when current_status is null or btrim(current_status) = '' then null
    when lower(btrim(current_status)) = 'in storage' then 'in_storage'
    when lower(btrim(current_status)) = 'on auction' then 'on_auction'
    else lower(btrim(current_status))
  end,
  public_visibility = case
    when public_visibility is null or btrim(public_visibility) = '' then null
    else lower(btrim(public_visibility))
  end;

update public.provenance_events
set visibility_level = case
  when visibility_level is null or btrim(visibility_level) = '' then null
  else lower(btrim(visibility_level))
end;

update public.provenance_authentications
set visibility_level = case
  when visibility_level is null or btrim(visibility_level) = '' then null
  else lower(btrim(visibility_level))
end;

update public.media_assets
set visibility_level = case
  when visibility_level is null or btrim(visibility_level) = '' then null
  else lower(btrim(visibility_level))
end;

update public.disclosure_controls
set visibility_level = case
  when visibility_level is null or btrim(visibility_level) = '' then null
  else lower(btrim(visibility_level))
end;

update public.provenance_transactions
set visibility_level = case
  when visibility_level is null or btrim(visibility_level) = '' then null
  else lower(btrim(visibility_level))
end;

update public.auctions
set
  auction_status = case
    when auction_status is null or btrim(auction_status) = '' then null
    when lower(btrim(auction_status)) = 'closed' then 'ended'
    else lower(btrim(auction_status))
  end,
  settlement_status = case
    when settlement_status is null or btrim(settlement_status) = '' then null
    else lower(btrim(settlement_status))
  end;

update public.certificates
set
  certificate_code = nullif(btrim(certificate_code), ''),
  status = case
    when status is null or btrim(status) = '' then null
    else lower(btrim(status))
  end;

update public.certificates
set revoked_at = coalesce(revoked_at, issued_at, created_at, timezone('utc'::text, now()))
where status = 'revoked'
  and revoked_at is null;

update public.product_shipping_profiles
set
  shipping_profile_code = lower(btrim(shipping_profile_code)),
  shipping_profile_name = btrim(shipping_profile_name),
  package_type = case
    when package_type is null or btrim(package_type) = '' then null
    else lower(btrim(package_type))
  end,
  carrier_preference = case
    when carrier_preference is null or btrim(carrier_preference) = '' then null
    else lower(btrim(carrier_preference))
  end;

update public.product_shipping_info
set
  shipping_profile_code = nullif(lower(btrim(shipping_profile_code)), ''),
  shipping_profile_name = nullif(btrim(shipping_profile_name), ''),
  shipping_info_status = case
    when shipping_info_status is null or btrim(shipping_info_status) = '' then 'empty'
    else lower(btrim(shipping_info_status))
  end,
  international_sale_status = case
    when international_sale_status is null or btrim(international_sale_status) = '' then 'draft'
    else lower(btrim(international_sale_status))
  end,
  package_type = case
    when package_type is null or btrim(package_type) = '' then null
    else lower(btrim(package_type))
  end,
  carrier_preference = case
    when carrier_preference is null or btrim(carrier_preference) = '' then null
    else lower(btrim(carrier_preference))
  end,
  brokerage_fee_policy = case
    when brokerage_fee_policy is null or btrim(brokerage_fee_policy) = '' then 'manual'
    else lower(btrim(brokerage_fee_policy))
  end,
  ddp_mode = case
    when ddp_mode is null or btrim(ddp_mode) = '' then 'none'
    else lower(btrim(ddp_mode))
  end,
  customs_risk_tier = case
    when customs_risk_tier is null or btrim(customs_risk_tier) = '' then 'medium'
    else lower(btrim(customs_risk_tier))
  end,
  allowed_destination_countries = array(
    select distinct upper(btrim(code))
    from unnest(coalesce(allowed_destination_countries, '{}'::text[])) as code
    where btrim(code) <> ''
    order by 1
  ),
  restricted_destination_countries = array(
    select distinct upper(btrim(code))
    from unnest(coalesce(restricted_destination_countries, '{}'::text[])) as code
    where btrim(code) <> ''
    order by 1
  );

update public.product_customs_info
set
  customs_info_status = case
    when customs_info_status is null or btrim(customs_info_status) = '' then 'empty'
    else lower(btrim(customs_info_status))
  end,
  customs_product_name_en = nullif(btrim(customs_product_name_en), ''),
  customs_product_type = nullif(btrim(customs_product_type), ''),
  hs_code_global_6 = nullif(regexp_replace(btrim(hs_code_global_6), '\D', '', 'g'), ''),
  hs_code_local = nullif(upper(btrim(hs_code_local)), ''),
  country_of_origin = nullif(upper(btrim(country_of_origin)), ''),
  commercial_invoice_description = nullif(btrim(commercial_invoice_description), ''),
  material_composition = nullif(btrim(material_composition), ''),
  declared_currency = nullif(upper(btrim(declared_currency)), ''),
  customs_notes_internal = nullif(btrim(customs_notes_internal), '');

with ranked_current_owners as (
  select
    ownership_id,
    row_number() over (
      partition by artifact_id
      order by coalesce(updated_at, created_at) desc, ownership_start_date desc nulls last, ownership_id desc
    ) as row_num
  from public.ownership_chain
  where is_current_owner is true
)
update public.ownership_chain chain
set
  is_current_owner = false,
  updated_at = timezone('utc'::text, now())
from ranked_current_owners ranked
where chain.ownership_id = ranked.ownership_id
  and ranked.row_num > 1;

with ranked_active_certificates as (
  select
    id,
    row_number() over (
      partition by artifact_id
      order by coalesce(issued_at, created_at) desc, created_at desc, id desc
    ) as row_num
  from public.certificates
  where status = 'active'
)
update public.certificates certificate
set status = 'superseded'
from ranked_active_certificates ranked
where certificate.id = ranked.id
  and ranked.row_num > 1;

alter table if exists public.provenance_artifacts
  drop constraint if exists provenance_artifacts_current_status_v1_check,
  drop constraint if exists provenance_artifacts_public_visibility_v1_check;

alter table if exists public.provenance_events
  drop constraint if exists provenance_events_visibility_level_v1_check;

alter table if exists public.provenance_authentications
  drop constraint if exists provenance_authentications_visibility_level_v1_check;

alter table if exists public.media_assets
  drop constraint if exists media_assets_visibility_level_v1_check;

alter table if exists public.disclosure_controls
  drop constraint if exists disclosure_controls_visibility_level_v1_check;

alter table if exists public.provenance_transactions
  drop constraint if exists provenance_transactions_visibility_level_v1_check;

alter table if exists public.auctions
  drop constraint if exists auctions_auction_status_v1_check,
  drop constraint if exists auctions_settlement_status_v1_check,
  drop constraint if exists auctions_time_window_v1_check,
  drop constraint if exists auctions_nonnegative_amounts_v1_check,
  drop constraint if exists auctions_estimate_window_v1_check,
  drop constraint if exists auctions_live_requires_start_v1_check,
  drop constraint if exists auctions_terminal_requires_end_v1_check,
  drop constraint if exists auctions_settled_requires_completed_settlement_v1_check;

alter table if exists public.certificates
  drop constraint if exists certificates_status_v1_check,
  drop constraint if exists certificates_revoked_timestamp_v1_check;

alter table if exists public.ownership_chain
  drop constraint if exists ownership_chain_date_window_v1_check;

alter table if exists public.bid_history
  drop constraint if exists bid_history_positive_bid_amount_v1_check,
  drop constraint if exists bid_history_auto_bid_floor_v1_check;

alter table if exists public.product_shipping_profiles
  drop constraint if exists product_shipping_profiles_package_type_v1_check,
  drop constraint if exists product_shipping_profiles_carrier_preference_v1_check,
  drop constraint if exists product_shipping_profiles_nonnegative_dimensions_v1_check;

alter table if exists public.product_shipping_info
  drop constraint if exists product_shipping_info_shipping_info_status_v1_check,
  drop constraint if exists product_shipping_info_international_sale_status_v1_check,
  drop constraint if exists product_shipping_info_package_type_v1_check,
  drop constraint if exists product_shipping_info_carrier_preference_v1_check,
  drop constraint if exists product_shipping_info_brokerage_fee_policy_v1_check,
  drop constraint if exists product_shipping_info_ddp_mode_v1_check,
  drop constraint if exists product_shipping_info_customs_risk_tier_v1_check,
  drop constraint if exists product_shipping_info_nonnegative_dimensions_v1_check,
  drop constraint if exists product_shipping_info_country_arrays_v1_check,
  drop constraint if exists product_shipping_info_international_ready_row_v1_check;

alter table if exists public.product_customs_info
  drop constraint if exists product_customs_info_customs_info_status_v1_check,
  drop constraint if exists product_customs_info_country_of_origin_v1_check,
  drop constraint if exists product_customs_info_hs_code_global_6_v1_check,
  drop constraint if exists product_customs_info_hs_code_local_v1_check,
  drop constraint if exists product_customs_info_declared_value_v1_check,
  drop constraint if exists product_customs_info_complete_row_v1_check;

alter table public.provenance_artifacts
  add constraint provenance_artifacts_current_status_v1_check
    check (
      current_status is null
      or current_status = any (
        array[
          'draft'::text,
          'archived'::text,
          'in_storage'::text,
          'listed'::text,
          'on_auction'::text,
          'sold'::text,
          'disputed'::text,
          'retired'::text
        ]
      )
    ) not valid,
  add constraint provenance_artifacts_public_visibility_v1_check
    check (
      public_visibility is null
      or public_visibility = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.provenance_events
  add constraint provenance_events_visibility_level_v1_check
    check (
      visibility_level is null
      or visibility_level = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.provenance_authentications
  add constraint provenance_authentications_visibility_level_v1_check
    check (
      visibility_level is null
      or visibility_level = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.media_assets
  add constraint media_assets_visibility_level_v1_check
    check (
      visibility_level is null
      or visibility_level = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.disclosure_controls
  add constraint disclosure_controls_visibility_level_v1_check
    check (
      visibility_level is null
      or visibility_level = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.provenance_transactions
  add constraint provenance_transactions_visibility_level_v1_check
    check (
      visibility_level is null
      or visibility_level = any (
        array['public'::text, 'collector_only'::text, 'internal_only'::text]
      )
    ) not valid;

alter table public.auctions
  add constraint auctions_auction_status_v1_check
    check (
      auction_status is null
      or auction_status = any (
        array[
          'draft'::text,
          'scheduled'::text,
          'live'::text,
          'ended'::text,
          'settled'::text,
          'cancelled'::text
        ]
      )
    ) not valid,
  add constraint auctions_settlement_status_v1_check
    check (
      settlement_status is null
      or settlement_status = any (
        array['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]
      )
    ) not valid,
  add constraint auctions_time_window_v1_check
    check (
      auction_start_time is null
      or auction_end_time is null
      or auction_end_time > auction_start_time
    ) not valid,
  add constraint auctions_nonnegative_amounts_v1_check
    check (
      coalesce(estimate_low, 0) >= 0
      and coalesce(estimate_high, 0) >= 0
      and coalesce(reserve_price, 0) >= 0
      and coalesce(opening_bid, 0) >= 0
      and coalesce(hammer_price, 0) >= 0
      and coalesce(final_price, 0) >= 0
      and coalesce(guarantee_amount, 0) >= 0
    ) not valid,
  add constraint auctions_estimate_window_v1_check
    check (
      estimate_low is null
      or estimate_high is null
      or estimate_high >= estimate_low
    ) not valid,
  add constraint auctions_live_requires_start_v1_check
    check (
      auction_status is distinct from 'live'
      or auction_start_time is not null
    ) not valid,
  add constraint auctions_terminal_requires_end_v1_check
    check (
      auction_status not in ('ended', 'settled', 'cancelled')
      or auction_end_time is not null
    ) not valid,
  add constraint auctions_settled_requires_completed_settlement_v1_check
    check (
      auction_status is distinct from 'settled'
      or settlement_status = 'completed'
    ) not valid;

alter table public.certificates
  add constraint certificates_status_v1_check
    check (
      status is not null
      and status = any (
        array['active'::text, 'superseded'::text, 'revoked'::text]
      )
    ) not valid,
  add constraint certificates_revoked_timestamp_v1_check
    check (
      (status = 'revoked' and revoked_at is not null)
      or (status <> 'revoked' and revoked_at is null)
    ) not valid;

alter table public.ownership_chain
  add constraint ownership_chain_date_window_v1_check
    check (
      ownership_start_date is null
      or ownership_end_date is null
      or ownership_end_date >= ownership_start_date
    ) not valid;

alter table public.bid_history
  add constraint bid_history_positive_bid_amount_v1_check
    check (bid_amount > 0) not valid,
  add constraint bid_history_auto_bid_floor_v1_check
    check (
      auto_bid_max is null
      or auto_bid_max >= bid_amount
    ) not valid;

alter table public.product_shipping_profiles
  add constraint product_shipping_profiles_package_type_v1_check
    check (
      package_type is null
      or package_type = any (
        array[
          'soft'::text,
          'box'::text,
          'premium_box'::text,
          'framed'::text,
          'electronics'::text,
          'special'::text
        ]
      )
    ) not valid,
  add constraint product_shipping_profiles_carrier_preference_v1_check
    check (
      carrier_preference is null
      or carrier_preference = any (
        array[
          'dhl'::text,
          'fedex'::text,
          'ups'::text,
          'ems'::text,
          'local'::text,
          'hand_carry'::text,
          'special'::text
        ]
      )
    ) not valid,
  add constraint product_shipping_profiles_nonnegative_dimensions_v1_check
    check (
      coalesce(estimated_package_weight_grams, 0) >= 0
      and coalesce(estimated_package_length_cm, 0) >= 0
      and coalesce(estimated_package_width_cm, 0) >= 0
      and coalesce(estimated_package_height_cm, 0) >= 0
    ) not valid;

alter table public.product_shipping_info
  add constraint product_shipping_info_shipping_info_status_v1_check
    check (
      shipping_info_status = any (
        array['empty'::text, 'partial'::text, 'complete'::text]
      )
    ) not valid,
  add constraint product_shipping_info_international_sale_status_v1_check
    check (
      international_sale_status = any (
        array[
          'draft'::text,
          'domestic_only'::text,
          'review_required'::text,
          'international_ready'::text,
          'restricted'::text
        ]
      )
    ) not valid,
  add constraint product_shipping_info_package_type_v1_check
    check (
      package_type is null
      or package_type = any (
        array[
          'soft'::text,
          'box'::text,
          'premium_box'::text,
          'framed'::text,
          'electronics'::text,
          'special'::text
        ]
      )
    ) not valid,
  add constraint product_shipping_info_carrier_preference_v1_check
    check (
      carrier_preference is null
      or carrier_preference = any (
        array[
          'dhl'::text,
          'fedex'::text,
          'ups'::text,
          'ems'::text,
          'local'::text,
          'hand_carry'::text,
          'special'::text
        ]
      )
    ) not valid,
  add constraint product_shipping_info_brokerage_fee_policy_v1_check
    check (
      brokerage_fee_policy = any (
        array['included'::text, 'excluded'::text, 'manual'::text]
      )
    ) not valid,
  add constraint product_shipping_info_ddp_mode_v1_check
    check (
      ddp_mode = any (
        array['none'::text, 'available'::text, 'required'::text]
      )
    ) not valid,
  add constraint product_shipping_info_customs_risk_tier_v1_check
    check (
      customs_risk_tier = any (
        array['low'::text, 'medium'::text, 'high'::text]
      )
    ) not valid,
  add constraint product_shipping_info_nonnegative_dimensions_v1_check
    check (
      coalesce(estimated_package_weight_grams, 0) >= 0
      and coalesce(estimated_package_length_cm, 0) >= 0
      and coalesce(estimated_package_width_cm, 0) >= 0
      and coalesce(estimated_package_height_cm, 0) >= 0
    ) not valid,
  add constraint product_shipping_info_country_arrays_v1_check
    check (
      public.krunch_are_iso2_country_codes(allowed_destination_countries)
      and public.krunch_are_iso2_country_codes(restricted_destination_countries)
    ) not valid,
  add constraint product_shipping_info_international_ready_row_v1_check
    check (
      international_sale_status <> 'international_ready'
      or (
        shipping_info_status = 'complete'
        and manual_review_required = false
        and (shipping_profile_code is not null or package_type is not null)
        and (estimated_package_weight_grams is not null or shipping_profile_code is not null)
      )
    ) not valid;

alter table public.product_customs_info
  add constraint product_customs_info_customs_info_status_v1_check
    check (
      customs_info_status = any (
        array['empty'::text, 'partial'::text, 'complete'::text]
      )
    ) not valid,
  add constraint product_customs_info_country_of_origin_v1_check
    check (
      public.krunch_is_iso2_country_code(country_of_origin)
    ) not valid,
  add constraint product_customs_info_hs_code_global_6_v1_check
    check (
      hs_code_global_6 is null
      or hs_code_global_6 ~ '^[0-9]{6}$'
    ) not valid,
  add constraint product_customs_info_hs_code_local_v1_check
    check (
      hs_code_local is null
      or hs_code_local ~ '^[A-Z0-9][A-Z0-9.\-]{1,19}$'
    ) not valid,
  add constraint product_customs_info_declared_value_v1_check
    check (
      declared_value_override is null
      or declared_value_override >= 0
    ) not valid,
  add constraint product_customs_info_complete_row_v1_check
    check (
      customs_info_status <> 'complete'
      or (
        customs_product_name_en is not null
        and country_of_origin is not null
        and (hs_code_global_6 is not null or hs_code_local is not null)
      )
    ) not valid;

create unique index if not exists ownership_chain_one_current_owner_idx
  on public.ownership_chain (artifact_id)
  where is_current_owner is true;

create unique index if not exists certificates_one_active_per_artifact_idx
  on public.certificates (artifact_id)
  where status = 'active';

do $$
begin
  if to_regclass('public.certificates_certificate_code_unique_idx') is null then
    if exists (
      select 1
      from (
        select lower(btrim(certificate_code)) as normalized_code
        from public.certificates
        where certificate_code is not null
          and btrim(certificate_code) <> ''
        group by lower(btrim(certificate_code))
        having count(*) > 1
      ) duplicate_codes
    ) then
      raise notice 'Skipped certificates_certificate_code_unique_idx because duplicate certificate_code values still exist.';
    else
      execute $sql$
        create unique index certificates_certificate_code_unique_idx
          on public.certificates ((lower(btrim(certificate_code))))
          where certificate_code is not null
            and btrim(certificate_code) <> ''
      $sql$;
    end if;
  end if;
end $$;

commit;
