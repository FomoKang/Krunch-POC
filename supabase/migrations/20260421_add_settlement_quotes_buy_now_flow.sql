-- Krunch hybrid buy-now settlement flow
-- Adds a realistic demo-ready settlement quote layer between Buy Now and payment.

begin;

create table if not exists public.purchase_settlement_quotes (
  quote_id uuid primary key default gen_random_uuid(),
  auction_id uuid references public.auctions(auction_id) on delete cascade,
  artifact_id uuid not null references public.provenance_artifacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_reference_id uuid,
  quote_status text not null default 'awaiting_shipping_info',

  destination_country text,
  recipient_name text,
  recipient_phone text,
  recipient_email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  customs_id_type text,
  customs_id_value text,
  personal_customs_clearance_number text,
  delivery_note text,

  shipping_profile_code text references public.product_shipping_profiles(shipping_profile_code) on update cascade,
  shipping_profile_name text,
  package_type text,
  carrier_preference text,
  estimated_package_weight_grams integer,
  estimated_package_length_cm numeric,
  estimated_package_width_cm numeric,
  estimated_package_height_cm numeric,
  ddp_supported boolean not null default false,
  ddp_mode text,
  insurance_required boolean not null default false,
  special_handling_required boolean not null default false,
  customs_risk_tier text,
  brokerage_fee_policy text,

  customs_product_name_en text,
  customs_product_type text,
  hs_code_global_6 text,
  hs_code_local text,
  country_of_origin text,
  commercial_invoice_description text,
  material_composition text,
  contains_battery boolean not null default false,
  contains_electronics boolean not null default false,
  contains_leather boolean not null default false,
  contains_fur boolean not null default false,
  preferential_origin_eligible boolean not null default false,
  declared_value_override numeric,
  declared_currency text,

  base_item_amount numeric not null default 0,
  buyer_premium_amount numeric not null default 0,
  shipping_amount numeric not null default 0,
  insurance_amount numeric not null default 0,
  estimated_duty_amount numeric not null default 0,
  estimated_vat_amount numeric not null default 0,
  extra_handling_amount numeric not null default 0,
  total_payable_amount numeric not null default 0,
  currency text not null default 'USD',

  is_demo boolean not null default false,
  manual_review_required boolean not null default false,
  review_reason text,
  quote_generated_at timestamp with time zone,
  payment_requested_at timestamp with time zone,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),

  constraint purchase_settlement_quotes_source_type_v1_check check (
    source_type = any (
      array[
        'auction_buy_now'::text,
        'auction_win'::text,
        'private_sale'::text,
        'admin_demo'::text
      ]
    )
  ),
  constraint purchase_settlement_quotes_quote_status_v1_check check (
    quote_status = any (
      array[
        'awaiting_shipping_info'::text,
        'quote_preparing'::text,
        'payment_requested'::text,
        'paid'::text,
        'review_required'::text,
        'cancelled'::text,
        'expired'::text
      ]
    )
  ),
  constraint purchase_settlement_quotes_amounts_nonnegative_v1_check check (
    coalesce(base_item_amount, 0) >= 0
    and coalesce(buyer_premium_amount, 0) >= 0
    and coalesce(shipping_amount, 0) >= 0
    and coalesce(insurance_amount, 0) >= 0
    and coalesce(estimated_duty_amount, 0) >= 0
    and coalesce(estimated_vat_amount, 0) >= 0
    and coalesce(extra_handling_amount, 0) >= 0
    and coalesce(total_payable_amount, 0) >= 0
  ),
  constraint purchase_settlement_quotes_destination_country_iso2_v1_check check (
    public.krunch_is_iso2_country_code(destination_country)
  ),
  constraint purchase_settlement_quotes_origin_country_iso2_v1_check check (
    public.krunch_is_iso2_country_code(country_of_origin)
  )
);

create table if not exists public.settlement_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.purchase_settlement_quotes(quote_id) on delete cascade,
  payment_provider text not null default 'demo_mock',
  payment_status text not null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  is_demo boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  response_payload jsonb not null default '{}'::jsonb,
  constraint settlement_payment_attempts_status_v1_check check (
    payment_status = any (array['requested'::text, 'succeeded'::text, 'failed'::text])
  ),
  constraint settlement_payment_attempts_amount_nonnegative_v1_check check (amount >= 0)
);

create index if not exists purchase_settlement_quotes_artifact_idx
  on public.purchase_settlement_quotes (artifact_id);

create index if not exists purchase_settlement_quotes_auction_idx
  on public.purchase_settlement_quotes (auction_id);

create index if not exists purchase_settlement_quotes_user_idx
  on public.purchase_settlement_quotes (user_id);

create index if not exists purchase_settlement_quotes_status_idx
  on public.purchase_settlement_quotes (quote_status);

create index if not exists purchase_settlement_quotes_created_idx
  on public.purchase_settlement_quotes (created_at desc);

create unique index if not exists purchase_settlement_quotes_active_buy_now_unique_idx
  on public.purchase_settlement_quotes (auction_id, user_id, source_type)
  where auction_id is not null
    and source_type = 'auction_buy_now'
    and quote_status = any (
      array[
        'awaiting_shipping_info'::text,
        'quote_preparing'::text,
        'payment_requested'::text,
        'review_required'::text
      ]
    );

create index if not exists settlement_payment_attempts_quote_idx
  on public.settlement_payment_attempts (quote_id, created_at desc);

create or replace function public.krunch_parse_percentage_rate(p_value text)
returns numeric
language plpgsql
immutable
as $$
declare
  normalized_value text;
  numeric_value numeric := 0;
begin
  if p_value is null or btrim(p_value) = '' then
    return 0;
  end if;

  normalized_value := nullif(regexp_replace(btrim(p_value), '[^0-9\.\-]', '', 'g'), '');

  if normalized_value is null then
    return 0;
  end if;

  numeric_value := normalized_value::numeric;

  if numeric_value <= 0 then
    return 0;
  end if;

  if numeric_value > 1 then
    return numeric_value / 100;
  end if;

  return numeric_value;
exception
  when others then
    return 0;
end;
$$;

create or replace function public.krunch_create_settlement_quote_from_buy_now(
  p_auction_id uuid,
  p_bidder_display_name text default null
)
returns public.purchase_settlement_quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  active_quote public.purchase_settlement_quotes%rowtype;
  inserted_bid public.auction_bids%rowtype;
  effective_user_id uuid := auth.uid();
  effective_display_name text;
  buyer_premium_rate numeric := 0;
  buyer_premium_amount numeric := 0;
  inserted_quote public.purchase_settlement_quotes%rowtype;
begin
  if effective_user_id is null then
    raise exception 'Please log in before starting a Buy Now settlement.';
  end if;

  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
  end if;

  select *
  into active_quote
  from public.purchase_settlement_quotes
  where auction_id = p_auction_id
    and user_id = effective_user_id
    and source_type = 'auction_buy_now'
    and quote_status = any (
      array[
        'awaiting_shipping_info'::text,
        'quote_preparing'::text,
        'payment_requested'::text,
        'review_required'::text,
        'paid'::text
      ]
    )
  order by created_at desc
  limit 1;

  if found then
    return active_quote;
  end if;

  if not public.krunch_is_internal_staff()
     and not exists (
       select 1
       from public.provenance_artifacts artifact
       where artifact.id = auction_row.artifact_id
         and artifact.public_visibility = 'public'
     ) then
    raise exception 'Auction % is not public.', p_auction_id;
  end if;

  if coalesce(auction_row.auction_status, 'draft') <> 'live' then
    raise exception 'Auction % is not live.', p_auction_id;
  end if;

  if auction_row.auction_type <> 'hybrid' then
    raise exception 'Buy Now is only available on hybrid auctions.';
  end if;

  if auction_row.buy_now_price is null or auction_row.buy_now_price <= 0 then
    raise exception 'Buy Now price has not been configured for this hybrid auction.';
  end if;

  effective_display_name := public.krunch_resolve_bidder_display_name(effective_user_id, p_bidder_display_name);
  buyer_premium_rate := public.krunch_parse_percentage_rate(auction_row.buyer_premium_rate);
  buyer_premium_amount := round(coalesce(auction_row.buy_now_price, 0) * buyer_premium_rate, 0);

  update public.auction_bids
  set is_winning_bid = false
  where auction_id = p_auction_id
    and is_winning_bid = true;

  insert into public.auction_bids (
    auction_id,
    bidder_user_id,
    bidder_display_name,
    bid_amount,
    bid_source,
    is_demo,
    is_valid,
    is_winning_bid
  )
  values (
    p_auction_id,
    effective_user_id,
    effective_display_name,
    auction_row.buy_now_price,
    'manual',
    coalesce(auction_row.demo_mode, false),
    true,
    true
  )
  returning *
  into inserted_bid;

  update public.auctions
  set auction_status = 'ended',
      auction_end_time = timezone('utc'::text, now()),
      hammer_price = inserted_bid.bid_amount,
      final_price = inserted_bid.bid_amount,
      winner_bidder_id = inserted_bid.bidder_user_id,
      winner_bid_id = inserted_bid.bid_id,
      settlement_status = 'pending',
      closing_reason = 'buy_now_pending_settlement',
      updated_at = timezone('utc'::text, now())
  where auction_id = p_auction_id;

  insert into public.auction_outcomes (
    auction_id,
    winner_user_id,
    winner_display_name,
    winning_bid_id,
    outcome_status,
    payment_due_at,
    is_demo
  )
  values (
    p_auction_id,
    inserted_bid.bidder_user_id,
    inserted_bid.bidder_display_name,
    inserted_bid.bid_id,
    'pending_payment',
    timezone('utc'::text, now()) + interval '72 hours',
    coalesce(auction_row.demo_mode, false)
  )
  on conflict (auction_id) do update
  set winner_user_id = excluded.winner_user_id,
      winner_display_name = excluded.winner_display_name,
      winning_bid_id = excluded.winning_bid_id,
      outcome_status = excluded.outcome_status,
      payment_due_at = excluded.payment_due_at,
      paid_at = null,
      reassigned_from_bid_id = null,
      is_demo = excluded.is_demo,
      updated_at = timezone('utc'::text, now());

  insert into public.purchase_settlement_quotes (
    auction_id,
    artifact_id,
    user_id,
    source_type,
    source_reference_id,
    quote_status,
    base_item_amount,
    buyer_premium_amount,
    currency,
    is_demo,
    expires_at
  )
  values (
    p_auction_id,
    auction_row.artifact_id,
    effective_user_id,
    'auction_buy_now',
    inserted_bid.bid_id,
    'awaiting_shipping_info',
    coalesce(auction_row.buy_now_price, 0),
    buyer_premium_amount,
    coalesce(nullif(btrim(auction_row.currency), ''), 'USD'),
    coalesce(auction_row.demo_mode, false),
    timezone('utc'::text, now()) + interval '72 hours'
  )
  returning *
  into inserted_quote;

  return inserted_quote;
end;
$$;

create or replace function public.krunch_save_settlement_quote_shipping_info(
  p_quote_id uuid,
  p_destination_country text,
  p_recipient_name text,
  p_recipient_phone text,
  p_recipient_email text default null,
  p_address_line_1 text default null,
  p_address_line_2 text default null,
  p_city text default null,
  p_state_region text default null,
  p_postal_code text default null,
  p_customs_id_type text default null,
  p_customs_id_value text default null,
  p_personal_customs_clearance_number text default null,
  p_delivery_note text default null
)
returns public.purchase_settlement_quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.purchase_settlement_quotes%rowtype;
  destination_country_normalized text := upper(nullif(btrim(p_destination_country), ''));
  recipient_name_normalized text := nullif(btrim(p_recipient_name), '');
  recipient_phone_normalized text := nullif(btrim(p_recipient_phone), '');
  address_line_1_normalized text := nullif(btrim(p_address_line_1), '');
  city_normalized text := nullif(btrim(p_city), '');
  postal_code_normalized text := nullif(btrim(p_postal_code), '');
  state_region_normalized text := nullif(btrim(p_state_region), '');
begin
  select *
  into quote_row
  from public.purchase_settlement_quotes
  where quote_id = p_quote_id
    and (
      user_id = auth.uid()
      or public.krunch_is_internal_staff()
    )
  for update;

  if not found then
    raise exception 'Settlement quote % not found.', p_quote_id;
  end if;

  if quote_row.quote_status in ('paid', 'cancelled', 'expired') then
    raise exception 'Settlement quote % can no longer accept shipping information.', p_quote_id;
  end if;

  if quote_row.expires_at is not null and quote_row.expires_at < timezone('utc'::text, now()) then
    update public.purchase_settlement_quotes
    set quote_status = 'expired',
        updated_at = timezone('utc'::text, now())
    where quote_id = p_quote_id;

    raise exception 'Settlement quote % has expired.', p_quote_id;
  end if;

  if destination_country_normalized is null or not public.krunch_is_iso2_country_code(destination_country_normalized) then
    raise exception 'Select a valid destination country.';
  end if;

  if recipient_name_normalized is null then
    raise exception 'Recipient name is required.';
  end if;

  if recipient_phone_normalized is null then
    raise exception 'Recipient phone is required.';
  end if;

  if address_line_1_normalized is null then
    raise exception 'Address line 1 is required.';
  end if;

  if city_normalized is null then
    raise exception 'City is required.';
  end if;

  if postal_code_normalized is null then
    raise exception 'Postal code is required.';
  end if;

  if destination_country_normalized = 'US' and state_region_normalized is null then
    raise exception 'State is required for US destinations.';
  end if;

  update public.purchase_settlement_quotes
  set destination_country = destination_country_normalized,
      recipient_name = recipient_name_normalized,
      recipient_phone = recipient_phone_normalized,
      recipient_email = nullif(btrim(p_recipient_email), ''),
      address_line_1 = address_line_1_normalized,
      address_line_2 = nullif(btrim(p_address_line_2), ''),
      city = city_normalized,
      state_region = state_region_normalized,
      postal_code = postal_code_normalized,
      customs_id_type = nullif(btrim(p_customs_id_type), ''),
      customs_id_value = nullif(btrim(p_customs_id_value), ''),
      personal_customs_clearance_number = nullif(btrim(p_personal_customs_clearance_number), ''),
      delivery_note = nullif(btrim(p_delivery_note), ''),
      quote_status = 'quote_preparing',
      updated_at = timezone('utc'::text, now())
  where quote_id = p_quote_id
  returning *
  into quote_row;

  return quote_row;
end;
$$;

create or replace function public.krunch_generate_settlement_quote(
  p_quote_id uuid
)
returns public.purchase_settlement_quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.purchase_settlement_quotes%rowtype;
  auction_row public.auctions%rowtype;
  shipping_row public.product_shipping_info%rowtype;
  customs_row public.product_customs_info%rowtype;
  shipping_profile_row public.product_shipping_profiles%rowtype;
  package_weight_grams integer := 600;
  package_length_cm numeric := 30;
  package_width_cm numeric := 22;
  package_height_cm numeric := 8;
  package_type_value text := 'box';
  carrier_value text := 'ems';
  ddp_supported_value boolean := false;
  ddp_mode_value text := 'none';
  insurance_required_value boolean := false;
  special_handling_required_value boolean := false;
  customs_risk_tier_value text := 'medium';
  brokerage_fee_policy_value text := 'manual';
  customs_product_name_value text;
  customs_product_type_value text;
  hs_code_global_value text;
  hs_code_local_value text;
  country_of_origin_value text;
  commercial_invoice_description_value text;
  material_composition_value text;
  contains_battery_value boolean := false;
  contains_electronics_value boolean := false;
  contains_leather_value boolean := false;
  contains_fur_value boolean := false;
  preferential_origin_eligible_value boolean := false;
  declared_value_override_value numeric;
  declared_currency_value text;
  zone_base_amount numeric := 0;
  weight_step_amount numeric := 0;
  volumetric_surcharge numeric := 0;
  package_multiplier numeric := 1;
  carrier_multiplier numeric := 1;
  insurance_floor_amount numeric := 0;
  duty_rate numeric := 0;
  vat_rate numeric := 0;
  shipping_amount_value numeric := 0;
  insurance_amount_value numeric := 0;
  duty_amount_value numeric := 0;
  vat_amount_value numeric := 0;
  extra_handling_amount_value numeric := 0;
  total_amount_value numeric := 0;
  declared_value_basis numeric := 0;
  taxable_value_basis numeric := 0;
  review_reason_value text := null;
  allowed_destinations text[] := '{}'::text[];
  restricted_destinations text[] := '{}'::text[];
  currency_is_krw boolean := false;
  eu_destinations text[] := array['AT', 'BE', 'DE', 'DK', 'ES', 'FI', 'FR', 'IE', 'IT', 'LU', 'NL', 'PT', 'SE'];
  refreshed_quote public.purchase_settlement_quotes%rowtype;
begin
  select *
  into quote_row
  from public.purchase_settlement_quotes
  where quote_id = p_quote_id
    and (
      user_id = auth.uid()
      or public.krunch_is_internal_staff()
    )
  for update;

  if not found then
    raise exception 'Settlement quote % not found.', p_quote_id;
  end if;

  if quote_row.quote_status in ('paid', 'cancelled', 'expired') then
    raise exception 'Settlement quote % can no longer be recalculated.', p_quote_id;
  end if;

  if quote_row.expires_at is not null and quote_row.expires_at < timezone('utc'::text, now()) then
    update public.purchase_settlement_quotes
    set quote_status = 'expired',
        updated_at = timezone('utc'::text, now())
    where quote_id = p_quote_id;

    raise exception 'Settlement quote % has expired.', p_quote_id;
  end if;

  if quote_row.destination_country is null
     or quote_row.recipient_name is null
     or quote_row.recipient_phone is null
     or quote_row.address_line_1 is null
     or quote_row.city is null
     or quote_row.postal_code is null then
    raise exception 'Shipping information is incomplete for settlement quote %.', p_quote_id;
  end if;

  if quote_row.destination_country = 'US' and quote_row.state_region is null then
    raise exception 'State is required for US destinations.';
  end if;

  if quote_row.auction_id is not null then
    select *
    into auction_row
    from public.auctions
    where auction_id = quote_row.auction_id;
  end if;

  select *
  into shipping_row
  from public.product_shipping_info
  where artifact_id = quote_row.artifact_id;

  select *
  into customs_row
  from public.product_customs_info
  where artifact_id = quote_row.artifact_id;

  if shipping_row.shipping_profile_code is not null then
    select *
    into shipping_profile_row
    from public.product_shipping_profiles
    where shipping_profile_code = shipping_row.shipping_profile_code;
  end if;

  package_weight_grams := greatest(
    coalesce(shipping_row.estimated_package_weight_grams, shipping_profile_row.estimated_package_weight_grams, 600),
    100
  );
  package_length_cm := greatest(coalesce(shipping_row.estimated_package_length_cm, shipping_profile_row.estimated_package_length_cm, 30), 5);
  package_width_cm := greatest(coalesce(shipping_row.estimated_package_width_cm, shipping_profile_row.estimated_package_width_cm, 22), 5);
  package_height_cm := greatest(coalesce(shipping_row.estimated_package_height_cm, shipping_profile_row.estimated_package_height_cm, 8), 2);
  package_type_value := coalesce(shipping_row.package_type, shipping_profile_row.package_type, 'box');
  carrier_value := coalesce(
    shipping_row.carrier_preference,
    shipping_profile_row.carrier_preference,
    case when quote_row.destination_country = 'KR' then 'local' else 'ems' end
  );
  ddp_supported_value := coalesce(shipping_row.ddp_supported, shipping_profile_row.ddp_supported, false);
  ddp_mode_value := coalesce(shipping_row.ddp_mode, case when ddp_supported_value then 'available' else 'none' end);
  insurance_required_value := coalesce(shipping_row.insurance_required, shipping_profile_row.insurance_required, false);
  special_handling_required_value := coalesce(
    shipping_row.special_handling_required,
    shipping_profile_row.special_handling_required,
    false
  );
  customs_risk_tier_value := coalesce(shipping_row.customs_risk_tier, 'medium');
  brokerage_fee_policy_value := coalesce(shipping_row.brokerage_fee_policy, 'manual');

  customs_product_name_value := coalesce(customs_row.customs_product_name_en, 'Collectible archive item');
  customs_product_type_value := coalesce(customs_row.customs_product_type, 'collectible');
  hs_code_global_value := customs_row.hs_code_global_6;
  hs_code_local_value := customs_row.hs_code_local;
  country_of_origin_value := upper(coalesce(customs_row.country_of_origin, 'KR'));
  commercial_invoice_description_value := coalesce(
    customs_row.commercial_invoice_description,
    customs_product_name_value
  );
  material_composition_value := customs_row.material_composition;
  contains_battery_value := coalesce(customs_row.contains_battery, false);
  contains_electronics_value := coalesce(customs_row.contains_electronics, false);
  contains_leather_value := coalesce(customs_row.contains_leather, false);
  contains_fur_value := coalesce(customs_row.contains_fur, false);
  preferential_origin_eligible_value := coalesce(customs_row.preferential_origin_eligible, false);
  declared_value_override_value := customs_row.declared_value_override;
  declared_currency_value := coalesce(customs_row.declared_currency, quote_row.currency);

  allowed_destinations := coalesce(shipping_row.allowed_destination_countries, '{}'::text[]);
  restricted_destinations := coalesce(shipping_row.restricted_destination_countries, '{}'::text[]);
  currency_is_krw := upper(coalesce(quote_row.currency, 'USD')) = 'KRW';

  if shipping_row.artifact_id is null then
    review_reason_value := 'Artifact shipping defaults have not been configured yet.';
  elsif customs_row.artifact_id is null then
    review_reason_value := 'Artifact customs defaults have not been configured yet.';
  elsif coalesce(shipping_row.international_sale_status, 'draft') = 'restricted' then
    review_reason_value := coalesce(shipping_row.restricted_reason, 'This artifact is currently restricted for international sale.');
  elsif coalesce(shipping_row.international_sale_status, 'draft') = 'review_required' then
    review_reason_value := 'Operations review is required before payment can be requested.';
  elsif coalesce(shipping_row.international_sale_status, 'draft') = 'domestic_only'
        and quote_row.destination_country <> 'KR' then
    review_reason_value := 'This artifact is configured for domestic-only settlement.';
  elsif quote_row.destination_country = any (restricted_destinations) then
    review_reason_value := coalesce(
      shipping_row.restricted_reason,
      format('Destination %s requires operations review before payment.', quote_row.destination_country)
    );
  elsif cardinality(allowed_destinations) > 0
        and quote_row.destination_country <> all (allowed_destinations) then
    review_reason_value := format(
      'Destination %s is outside the allowed shipping profile for this artifact.',
      quote_row.destination_country
    );
  elsif coalesce(shipping_row.manual_review_required, false) then
    review_reason_value := 'Manual review has been flagged on the artifact shipping profile.';
  elsif coalesce(shipping_row.shipping_info_status, 'empty') <> 'complete' then
    review_reason_value := 'Artifact shipping defaults are incomplete and require operations review.';
  elsif coalesce(customs_row.customs_info_status, 'empty') <> 'complete' then
    review_reason_value := 'Artifact customs defaults are incomplete and require operations review.';
  end if;

  if currency_is_krw then
    weight_step_amount := 7000;
    insurance_floor_amount := 15000;
  else
    weight_step_amount := 7;
    insurance_floor_amount := 15;
  end if;

  if quote_row.destination_country = 'KR' then
    zone_base_amount := case when currency_is_krw then 18000 else 18 end;
  elsif quote_row.destination_country = any (array['JP', 'CN', 'TW', 'HK']) then
    zone_base_amount := case when currency_is_krw then 46000 else 46 end;
  elsif quote_row.destination_country = any (array['SG', 'TH', 'VN', 'MY', 'ID', 'PH']) then
    zone_base_amount := case when currency_is_krw then 52000 else 52 end;
  elsif quote_row.destination_country = any (array['US', 'CA']) then
    zone_base_amount := case when currency_is_krw then 88000 else 88 end;
  elsif quote_row.destination_country = any (eu_destinations)
        or quote_row.destination_country = 'GB' then
    zone_base_amount := case when currency_is_krw then 84000 else 84 end;
  elsif quote_row.destination_country = any (array['AU', 'NZ']) then
    zone_base_amount := case when currency_is_krw then 96000 else 96 end;
  else
    zone_base_amount := case when currency_is_krw then 108000 else 108 end;
  end if;

  package_multiplier := case package_type_value
    when 'soft' then 1.00
    when 'box' then 1.10
    when 'premium_box' then 1.28
    when 'framed' then 1.45
    when 'electronics' then 1.33
    when 'special' then 1.62
    else 1.12
  end;

  carrier_multiplier := case carrier_value
    when 'local' then 0.92
    when 'ems' then 1.00
    when 'ups' then 1.14
    when 'fedex' then 1.18
    when 'dhl' then 1.22
    when 'hand_carry' then 2.20
    when 'special' then 1.55
    else 1.08
  end;

  if greatest(package_length_cm, package_width_cm, package_height_cm) >= 70
     or package_length_cm + package_width_cm + package_height_cm >= 130 then
    volumetric_surcharge := case when currency_is_krw then 18000 else 18 end;
  end if;

  extra_handling_amount_value := 0;

  if special_handling_required_value then
    extra_handling_amount_value := extra_handling_amount_value + case when currency_is_krw then 18000 else 18 end;
  end if;

  if customs_risk_tier_value = 'high' then
    extra_handling_amount_value := extra_handling_amount_value + case when currency_is_krw then 22000 else 22 end;
  elsif customs_risk_tier_value = 'medium' then
    extra_handling_amount_value := extra_handling_amount_value + case when currency_is_krw then 8000 else 8 end;
  end if;

  if quote_row.destination_country <> 'KR' and brokerage_fee_policy_value = 'manual' then
    extra_handling_amount_value := extra_handling_amount_value + case when currency_is_krw then 6000 else 6 end;
  end if;

  shipping_amount_value := round(
    (
      zone_base_amount
      + (greatest(package_weight_grams - 250, 0) / 250.0) * weight_step_amount
      + volumetric_surcharge
    ) * package_multiplier * carrier_multiplier,
    0
  ) + extra_handling_amount_value;

  insurance_amount_value := case
    when insurance_required_value
      then greatest(round(coalesce(quote_row.base_item_amount, 0) * 0.012, 0), insurance_floor_amount)
    else 0
  end;

  declared_value_basis := coalesce(declared_value_override_value, quote_row.base_item_amount, 0);
  taxable_value_basis := greatest(declared_value_basis + shipping_amount_value + insurance_amount_value, 0);

  if quote_row.destination_country = 'KR' then
    duty_rate := case
      when country_of_origin_value = 'KR' then 0
      when contains_electronics_value or contains_battery_value then 0.04
      when contains_leather_value or contains_fur_value then 0.08
      else 0.06
    end;
    vat_rate := case when country_of_origin_value = 'KR' then 0 else 0.10 end;
  elsif quote_row.destination_country = 'US' then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.10
      when contains_electronics_value or contains_battery_value then 0.03
      when lower(customs_product_type_value) like '%apparel%' then 0.08
      else 0.04
    end;
    vat_rate := 0;
  elsif quote_row.destination_country = any (eu_destinations) then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.14
      when contains_electronics_value or contains_battery_value then 0.04
      when lower(customs_product_type_value) like '%apparel%' then 0.12
      else 0.06
    end;
    vat_rate := 0.20;
  elsif quote_row.destination_country = 'GB' then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.12
      when contains_electronics_value or contains_battery_value then 0.03
      when lower(customs_product_type_value) like '%apparel%' then 0.10
      else 0.05
    end;
    vat_rate := 0.20;
  elsif quote_row.destination_country = 'JP' then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.09
      when lower(customs_product_type_value) like '%apparel%' then 0.07
      when contains_electronics_value or contains_battery_value then 0.03
      else 0.04
    end;
    vat_rate := 0.10;
  elsif quote_row.destination_country in ('SG', 'HK') then
    duty_rate := 0;
    vat_rate := 0;
  elsif quote_row.destination_country = 'CA' then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.09
      when lower(customs_product_type_value) like '%apparel%' then 0.07
      when contains_electronics_value or contains_battery_value then 0.03
      else 0.05
    end;
    vat_rate := 0.13;
  elsif quote_row.destination_country in ('AU', 'NZ') then
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.07
      when lower(customs_product_type_value) like '%apparel%' then 0.05
      when contains_electronics_value or contains_battery_value then 0.02
      else 0.04
    end;
    vat_rate := 0.10;
  else
    duty_rate := case
      when contains_leather_value or contains_fur_value then 0.10
      when lower(customs_product_type_value) like '%apparel%' then 0.08
      when contains_electronics_value or contains_battery_value then 0.04
      else 0.06
    end;
    vat_rate := 0.12;
  end if;

  duty_amount_value := round(taxable_value_basis * duty_rate, 0);
  vat_amount_value := round((taxable_value_basis + duty_amount_value) * vat_rate, 0);
  total_amount_value := round(
    coalesce(quote_row.base_item_amount, 0)
    + coalesce(quote_row.buyer_premium_amount, 0)
    + shipping_amount_value
    + insurance_amount_value
    + duty_amount_value
    + vat_amount_value
    + extra_handling_amount_value,
    0
  );

  update public.purchase_settlement_quotes
  set shipping_profile_code = shipping_row.shipping_profile_code,
      shipping_profile_name = coalesce(shipping_row.shipping_profile_name, shipping_profile_row.shipping_profile_name),
      package_type = package_type_value,
      carrier_preference = carrier_value,
      estimated_package_weight_grams = package_weight_grams,
      estimated_package_length_cm = package_length_cm,
      estimated_package_width_cm = package_width_cm,
      estimated_package_height_cm = package_height_cm,
      ddp_supported = ddp_supported_value,
      ddp_mode = ddp_mode_value,
      insurance_required = insurance_required_value,
      special_handling_required = special_handling_required_value,
      customs_risk_tier = customs_risk_tier_value,
      brokerage_fee_policy = brokerage_fee_policy_value,
      customs_product_name_en = customs_product_name_value,
      customs_product_type = customs_product_type_value,
      hs_code_global_6 = hs_code_global_value,
      hs_code_local = hs_code_local_value,
      country_of_origin = country_of_origin_value,
      commercial_invoice_description = commercial_invoice_description_value,
      material_composition = material_composition_value,
      contains_battery = contains_battery_value,
      contains_electronics = contains_electronics_value,
      contains_leather = contains_leather_value,
      contains_fur = contains_fur_value,
      preferential_origin_eligible = preferential_origin_eligible_value,
      declared_value_override = declared_value_override_value,
      declared_currency = declared_currency_value,
      shipping_amount = shipping_amount_value,
      insurance_amount = insurance_amount_value,
      estimated_duty_amount = duty_amount_value,
      estimated_vat_amount = vat_amount_value,
      extra_handling_amount = extra_handling_amount_value,
      total_payable_amount = total_amount_value,
      manual_review_required = review_reason_value is not null,
      review_reason = review_reason_value,
      quote_status = case when review_reason_value is not null then 'review_required' else 'payment_requested' end,
      quote_generated_at = timezone('utc'::text, now()),
      payment_requested_at = case when review_reason_value is not null then null else timezone('utc'::text, now()) end,
      updated_at = timezone('utc'::text, now())
  where quote_id = p_quote_id
  returning *
  into refreshed_quote;

  return refreshed_quote;
end;
$$;

create or replace function public.krunch_mark_settlement_quote_paid(
  p_quote_id uuid,
  p_payment_provider text default 'demo_mock'
)
returns public.purchase_settlement_quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  quote_row public.purchase_settlement_quotes%rowtype;
  payment_provider_value text := coalesce(nullif(btrim(p_payment_provider), ''), 'demo_mock');
  paid_quote public.purchase_settlement_quotes%rowtype;
begin
  select *
  into quote_row
  from public.purchase_settlement_quotes
  where quote_id = p_quote_id
    and (
      user_id = auth.uid()
      or public.krunch_is_internal_staff()
    )
  for update;

  if not found then
    raise exception 'Settlement quote % not found.', p_quote_id;
  end if;

  if quote_row.quote_status = 'paid' then
    return quote_row;
  end if;

  if quote_row.quote_status <> 'payment_requested' then
    raise exception 'Settlement quote % is not ready for payment.', p_quote_id;
  end if;

  if quote_row.expires_at is not null and quote_row.expires_at < timezone('utc'::text, now()) then
    update public.purchase_settlement_quotes
    set quote_status = 'expired',
        updated_at = timezone('utc'::text, now())
    where quote_id = p_quote_id;

    raise exception 'Settlement quote % has expired.', p_quote_id;
  end if;

  insert into public.settlement_payment_attempts (
    quote_id,
    payment_provider,
    payment_status,
    amount,
    currency,
    is_demo,
    response_payload
  )
  values (
    p_quote_id,
    payment_provider_value,
    'requested',
    quote_row.total_payable_amount,
    quote_row.currency,
    quote_row.is_demo,
    jsonb_build_object(
      'stage', 'request',
      'mode', case when quote_row.is_demo then 'demo_mock' else 'integration_placeholder' end
    )
  );

  insert into public.settlement_payment_attempts (
    quote_id,
    payment_provider,
    payment_status,
    amount,
    currency,
    is_demo,
    response_payload
  )
  values (
    p_quote_id,
    payment_provider_value,
    'succeeded',
    quote_row.total_payable_amount,
    quote_row.currency,
    quote_row.is_demo,
    jsonb_build_object(
      'stage', 'capture',
      'mode', case when quote_row.is_demo then 'demo_mock' else 'integration_placeholder' end,
      'message', 'Payment provider integration hook can replace this mock capture.'
    )
  );

  update public.purchase_settlement_quotes
  set quote_status = 'paid',
      paid_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  where quote_id = p_quote_id
  returning *
  into paid_quote;

  if paid_quote.auction_id is not null then
    update public.auction_outcomes
    set outcome_status = 'paid',
        paid_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    where auction_id = paid_quote.auction_id;

    update public.auctions
    set auction_status = 'settled',
        settlement_status = 'completed',
        updated_at = timezone('utc'::text, now())
    where auction_id = paid_quote.auction_id;
  end if;

  return paid_quote;
end;
$$;

alter table if exists public.purchase_settlement_quotes enable row level security;
alter table if exists public.settlement_payment_attempts enable row level security;

drop policy if exists purchase_settlement_quotes_select_internal_or_owner on public.purchase_settlement_quotes;
create policy purchase_settlement_quotes_select_internal_or_owner
on public.purchase_settlement_quotes
for select
to authenticated
using (
  public.krunch_is_internal_staff()
  or user_id = auth.uid()
);

drop policy if exists purchase_settlement_quotes_insert_internal_only on public.purchase_settlement_quotes;
create policy purchase_settlement_quotes_insert_internal_only
on public.purchase_settlement_quotes
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'finance', 'super_admin']));

drop policy if exists purchase_settlement_quotes_update_internal_only on public.purchase_settlement_quotes;
create policy purchase_settlement_quotes_update_internal_only
on public.purchase_settlement_quotes
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'finance', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'finance', 'super_admin']));

drop policy if exists purchase_settlement_quotes_delete_super_admin on public.purchase_settlement_quotes;
create policy purchase_settlement_quotes_delete_super_admin
on public.purchase_settlement_quotes
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists settlement_payment_attempts_select_internal_or_owner on public.settlement_payment_attempts;
create policy settlement_payment_attempts_select_internal_or_owner
on public.settlement_payment_attempts
for select
to authenticated
using (
  public.krunch_is_internal_staff()
  or exists (
    select 1
    from public.purchase_settlement_quotes quote
    where quote.quote_id = settlement_payment_attempts.quote_id
      and quote.user_id = auth.uid()
  )
);

drop policy if exists settlement_payment_attempts_insert_internal_only on public.settlement_payment_attempts;
create policy settlement_payment_attempts_insert_internal_only
on public.settlement_payment_attempts
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']));

drop policy if exists settlement_payment_attempts_update_internal_only on public.settlement_payment_attempts;
create policy settlement_payment_attempts_update_internal_only
on public.settlement_payment_attempts
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']));

drop policy if exists settlement_payment_attempts_delete_super_admin on public.settlement_payment_attempts;
create policy settlement_payment_attempts_delete_super_admin
on public.settlement_payment_attempts
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

grant execute on function public.krunch_create_settlement_quote_from_buy_now(uuid, text) to authenticated;
grant execute on function public.krunch_save_settlement_quote_shipping_info(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.krunch_generate_settlement_quote(uuid) to authenticated;
grant execute on function public.krunch_mark_settlement_quote_paid(uuid, text) to authenticated;

comment on table public.purchase_settlement_quotes is
  'Per-transaction shipping input, operational snapshots, and payment-ready quote state for demo-ready settlement flows.';

comment on table public.settlement_payment_attempts is
  'Payment attempt ledger for settlement quotes. Demo mode writes mocked request/capture payloads for believable payment traces.';

comment on function public.krunch_create_settlement_quote_from_buy_now(uuid, text) is
  'Hybrid buy-now entry point. Reserves the lot, creates a pending quote, and hands the user into shipping collection before payment.';

comment on function public.krunch_save_settlement_quote_shipping_info(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) is
  'Persists user-provided recipient and customs recipient fields, then marks the quote as quote_preparing.';

comment on function public.krunch_generate_settlement_quote(uuid) is
  'Snapshots artifact logistics defaults, runs deterministic demo quote logic, and returns payment_requested or review_required.';

comment on function public.krunch_mark_settlement_quote_paid(uuid, text) is
  'Mock/demo payment capture path. Marks the quote paid, records payment attempts, and settles the linked auction.';

commit;
