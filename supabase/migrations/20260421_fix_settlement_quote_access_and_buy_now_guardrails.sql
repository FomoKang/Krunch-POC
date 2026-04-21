-- Krunch settlement quote follow-up fixes
-- 1. Explicitly grant authenticated read access for direct quote listing screens.
-- 2. Reset stale quote totals/review flags when shipping info is resubmitted.
-- 3. Revoke the deprecated instant Buy Now RPC so clients must use the settlement flow.

begin;

grant select on table public.purchase_settlement_quotes to authenticated;
grant select on table public.settlement_payment_attempts to authenticated;

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
      shipping_amount = 0,
      insurance_amount = 0,
      estimated_duty_amount = 0,
      estimated_vat_amount = 0,
      extra_handling_amount = 0,
      total_payable_amount = coalesce(base_item_amount, 0) + coalesce(buyer_premium_amount, 0),
      manual_review_required = false,
      review_reason = null,
      quote_generated_at = null,
      payment_requested_at = null,
      updated_at = timezone('utc'::text, now())
  where quote_id = p_quote_id
  returning *
  into quote_row;

  return quote_row;
end;
$$;

revoke execute on function public.krunch_buy_now_auction(uuid, text) from anon, authenticated;

comment on function public.krunch_buy_now_auction(uuid, text) is
  'Deprecated instant hybrid buy-now RPC. Clients must use krunch_create_settlement_quote_from_buy_now so shipping and settlement are collected before payment.';

comment on function public.krunch_save_settlement_quote_shipping_info(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) is
  'Persists recipient shipping/customs input, resets stale quote totals/review flags, and moves the quote back to quote_preparing.';

commit;
