-- Krunch demo auction MVP
-- Preserves the existing auctions table and layers in:
-- - premium / hybrid auction logic
-- - public bidding + buy now flows
-- - demo/live separation
-- - admin-only simulation controls

begin;

alter table if exists public.auctions
  add column if not exists minimum_increment numeric,
  add column if not exists buy_now_price numeric,
  add column if not exists winner_bid_id uuid,
  add column if not exists extension_rule_enabled boolean not null default true,
  add column if not exists extension_seconds integer not null default 30,
  add column if not exists demo_mode boolean not null default false;

update public.auctions
set minimum_increment = case
  when coalesce(opening_bid, 0) >= 10000000 then 500000
  when coalesce(opening_bid, 0) >= 1000000 then 100000
  when coalesce(opening_bid, 0) >= 100000 then 10000
  else 1000
end
where minimum_increment is null;

update public.auctions
set extension_rule_enabled = true
where extension_rule_enabled is null;

update public.auctions
set extension_seconds = 30
where extension_seconds is null or extension_seconds <= 0;

update public.auctions
set buy_now_price = case
  when auction_type = 'hybrid' and opening_bid is not null then round(opening_bid * 1.5, 0)
  else null
end
where buy_now_price is null
   or auction_type = 'premium';

alter table if exists public.auctions
  drop constraint if exists auctions_minimum_increment_v1_check,
  drop constraint if exists auctions_buy_now_price_v1_check,
  drop constraint if exists auctions_extension_seconds_v1_check;

alter table if exists public.auctions
  add constraint auctions_minimum_increment_v1_check
    check (minimum_increment is null or minimum_increment >= 0),
  add constraint auctions_buy_now_price_v1_check
    check (buy_now_price is null or buy_now_price >= 0),
  add constraint auctions_extension_seconds_v1_check
    check (extension_seconds >= 0);

create table if not exists public.auction_bids (
  bid_id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(auction_id) on delete cascade,
  bidder_user_id uuid references auth.users(id) on delete set null,
  bidder_display_name text not null,
  bid_amount numeric not null,
  bid_source text not null default 'manual',
  is_demo boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  is_valid boolean not null default true,
  is_winning_bid boolean not null default false,
  constraint auction_bids_positive_amount_v1_check check (bid_amount > 0),
  constraint auction_bids_source_v1_check check (
    bid_source = any (array['manual'::text, 'simulated'::text, 'admin_demo'::text])
  )
);

create table if not exists public.auction_outcomes (
  outcome_id uuid primary key default gen_random_uuid(),
  auction_id uuid not null unique references public.auctions(auction_id) on delete cascade,
  winner_user_id uuid references auth.users(id) on delete set null,
  winner_display_name text,
  winning_bid_id uuid references public.auction_bids(bid_id) on delete set null,
  outcome_status text not null default 'pending_payment',
  payment_due_at timestamp with time zone,
  paid_at timestamp with time zone,
  reassigned_from_bid_id uuid references public.auction_bids(bid_id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint auction_outcomes_status_v1_check check (
    outcome_status = any (
      array[
        'pending_payment'::text,
        'paid'::text,
        'failed'::text,
        'reassigned'::text,
        'cancelled'::text
      ]
    )
  )
);

create index if not exists auction_bids_auction_created_idx
  on public.auction_bids (auction_id, created_at desc);

create index if not exists auction_bids_auction_winning_idx
  on public.auction_bids (auction_id, is_winning_bid, created_at desc);

create index if not exists auction_outcomes_auction_idx
  on public.auction_outcomes (auction_id);

alter table if exists public.auctions
  drop constraint if exists auctions_winner_bid_id_fkey;

alter table if exists public.auctions
  add constraint auctions_winner_bid_id_fkey
    foreign key (winner_bid_id)
    references public.auction_bids(bid_id)
    on delete set null;

create or replace function public.krunch_apply_auction_mvp_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.minimum_increment is null then
    new.minimum_increment := case
      when coalesce(new.opening_bid, 0) >= 10000000 then 500000
      when coalesce(new.opening_bid, 0) >= 1000000 then 100000
      when coalesce(new.opening_bid, 0) >= 100000 then 10000
      else 1000
    end;
  end if;

  if new.extension_rule_enabled is null then
    new.extension_rule_enabled := true;
  end if;

  if new.extension_seconds is null or new.extension_seconds <= 0 then
    new.extension_seconds := 30;
  end if;

  if new.auction_type = 'hybrid' and new.opening_bid is not null then
    new.buy_now_price := round(new.opening_bid * 1.5, 0);
  elsif new.auction_type = 'premium' then
    new.buy_now_price := null;
  end if;

  return new;
end;
$$;

drop trigger if exists krunch_apply_auction_mvp_defaults_trg on public.auctions;
create trigger krunch_apply_auction_mvp_defaults_trg
before insert or update on public.auctions
for each row
execute function public.krunch_apply_auction_mvp_defaults();

create or replace function public.krunch_resolve_bidder_display_name(
  p_user_id uuid,
  p_display_name text default null
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resolved_name text;
begin
  if p_display_name is not null and btrim(p_display_name) <> '' then
    return left(btrim(p_display_name), 60);
  end if;

  if p_user_id is not null then
    select coalesce(nullif(btrim(profile.nickname), ''), split_part(profile.email, '@', 1))
    into resolved_name
    from public.profiles as profile
    where profile.id = p_user_id;

    if resolved_name is not null and btrim(resolved_name) <> '' then
      return left(btrim(resolved_name), 60);
    end if;
  end if;

  return 'Guest Bidder';
end;
$$;

create or replace function public.krunch_next_valid_bid_amount(
  p_auction_id uuid
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  bid_count integer := 0;
  highest_bid numeric := 0;
begin
  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
  end if;

  select count(*), coalesce(max(bid_amount), 0)
  into bid_count, highest_bid
  from public.auction_bids
  where auction_id = p_auction_id
    and is_valid = true;

  if bid_count = 0 then
    return coalesce(auction_row.opening_bid, 0);
  end if;

  return highest_bid + coalesce(auction_row.minimum_increment, 0);
end;
$$;

create or replace function public.krunch_place_auction_bid(
  p_auction_id uuid,
  p_bid_amount numeric,
  p_bidder_display_name text default null,
  p_bid_source text default 'manual'
)
returns public.auction_bids
language plpgsql
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  inserted_bid public.auction_bids%rowtype;
  next_amount numeric;
  bid_count integer := 0;
  effective_user_id uuid := auth.uid();
  effective_display_name text;
  should_extend boolean := false;
begin
  if p_bid_amount is null or p_bid_amount <= 0 then
    raise exception 'Bid amount must be greater than zero.';
  end if;

  if p_bid_source not in ('manual', 'simulated', 'admin_demo') then
    raise exception 'Unsupported bid source %.', p_bid_source;
  end if;

  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
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

  if p_bid_source in ('simulated', 'admin_demo') and not coalesce(auction_row.demo_mode, false) then
    raise exception 'Simulated bids are only allowed for demo auctions.';
  end if;

  if p_bid_source in ('simulated', 'admin_demo')
     and not public.krunch_has_any_role(array['admin', 'ops', 'super_admin']) then
    raise exception 'Only internal operators can create simulated demo bids.';
  end if;

  if auction_row.auction_type = 'hybrid'
     and auction_row.buy_now_price is not null
     and p_bid_amount >= auction_row.buy_now_price then
    raise exception 'Use Buy Now to close a hybrid auction at the buy-now price.';
  end if;

  select count(*)
  into bid_count
  from public.auction_bids
  where auction_id = p_auction_id
    and is_valid = true;

  next_amount := public.krunch_next_valid_bid_amount(p_auction_id);

  if bid_count = 0 then
    if p_bid_amount < next_amount then
      raise exception 'First bid must be at least the opening bid.';
    end if;
  elsif p_bid_amount < next_amount then
    raise exception 'Bid must be at least %.', next_amount;
  end if;

  effective_display_name := public.krunch_resolve_bidder_display_name(effective_user_id, p_bidder_display_name);

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
    p_bid_amount,
    p_bid_source,
    coalesce(auction_row.demo_mode, false),
    true,
    true
  )
  returning *
  into inserted_bid;

  should_extend :=
    coalesce(auction_row.extension_rule_enabled, true)
    and auction_row.auction_end_time is not null
    and auction_row.auction_end_time > timezone('utc'::text, now())
    and auction_row.auction_end_time <= timezone('utc'::text, now()) + make_interval(secs => coalesce(auction_row.extension_seconds, 30));

  update public.auctions
  set auction_end_time = case
        when should_extend then auction_end_time + make_interval(secs => coalesce(extension_seconds, 30))
        else auction_end_time
      end,
      winner_bidder_id = inserted_bid.bidder_user_id,
      winner_bid_id = inserted_bid.bid_id,
      updated_at = timezone('utc'::text, now())
  where auction_id = p_auction_id;

  return inserted_bid;
end;
$$;

create or replace function public.krunch_buy_now_auction(
  p_auction_id uuid,
  p_bidder_display_name text default null
)
returns public.auction_bids
language plpgsql
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  inserted_bid public.auction_bids%rowtype;
  effective_user_id uuid := auth.uid();
  effective_display_name text;
begin
  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
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

  return inserted_bid;
end;
$$;

create or replace function public.krunch_seed_demo_auction_history(
  p_auction_id uuid,
  p_seed_count integer default 5
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  seed_count integer := greatest(3, least(coalesce(p_seed_count, 5), 5));
  existing_count integer := 0;
  current_amount numeric;
  amount_step numeric;
  i integer;
  simulated_names text[] := array['Collector A', 'Collector B', 'VIP Fan', 'Archive Buyer', 'Premium Bidder'];
begin
  if not public.krunch_has_any_role(array['admin', 'ops', 'super_admin']) then
    raise exception 'Only internal operators can seed demo auction history.';
  end if;

  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
  end if;

  if not coalesce(auction_row.demo_mode, false) then
    raise exception 'Sample bid history can only be seeded for demo auctions.';
  end if;

  select count(*)
  into existing_count
  from public.auction_bids
  where auction_id = p_auction_id;

  if existing_count > 0 then
    return 0;
  end if;

  current_amount := greatest(coalesce(auction_row.opening_bid, 0), 1000);
  amount_step := greatest(coalesce(auction_row.minimum_increment, 0), 1000);

  for i in 1..seed_count loop
    insert into public.auction_bids (
      auction_id,
      bidder_display_name,
      bid_amount,
      bid_source,
      is_demo,
      created_at,
      is_valid,
      is_winning_bid
    )
    values (
      p_auction_id,
      simulated_names[1 + ((i - 1) % array_length(simulated_names, 1))],
      current_amount,
      'simulated',
      true,
      coalesce(auction_row.auction_start_time, timezone('utc'::text, now()) - interval '90 minutes') + make_interval(mins => i * 4),
      true,
      false
    );

    current_amount := current_amount + amount_step;
  end loop;

  update public.auction_bids
  set is_winning_bid = (bid_id = latest.bid_id)
  from (
    select bid_id
    from public.auction_bids
    where auction_id = p_auction_id
      and is_valid = true
    order by bid_amount desc, created_at asc
    limit 1
  ) as latest
  where auction_bids.auction_id = p_auction_id;

  update public.auctions
  set winner_bid_id = latest.bid_id,
      hammer_price = null,
      final_price = null,
      winner_bidder_id = latest.bidder_user_id,
      updated_at = timezone('utc'::text, now())
  from (
    select bid_id, bidder_user_id
    from public.auction_bids
    where auction_id = p_auction_id
      and is_valid = true
    order by bid_amount desc, created_at asc
    limit 1
  ) as latest
  where auctions.auction_id = p_auction_id;

  return seed_count;
end;
$$;

create or replace function public.krunch_admin_simulate_auction_action(
  p_auction_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  auction_row public.auctions%rowtype;
  latest_bid public.auction_bids%rowtype;
  previous_winner_id uuid;
  previous_bid_id uuid;
  next_amount numeric;
  buy_now_ceiling numeric;
  second_bid public.auction_bids%rowtype;
begin
  if not public.krunch_has_any_role(array['admin', 'ops', 'super_admin']) then
    raise exception 'Only internal operators can run auction simulations.';
  end if;

  select *
  into auction_row
  from public.auctions
  where auction_id = p_auction_id
  for update;

  if not found then
    raise exception 'Auction % not found.', p_auction_id;
  end if;

  if not coalesce(auction_row.demo_mode, false) then
    raise exception 'Simulation controls are only available for demo auctions.';
  end if;

  if p_action in ('simulate_bid', 'simulate_last_minute_bid')
     and coalesce(auction_row.auction_status, 'draft') <> 'live' then
    raise exception 'Demo bid actions are only available on live auctions.';
  end if;

  if p_action = 'simulate_extension'
     and coalesce(auction_row.auction_status, 'draft') not in ('scheduled', 'live') then
    raise exception 'Auction time can only be extended before the auction is finalized.';
  end if;

  if p_action in ('end_auction_now', 'mark_payment_pending', 'mark_payment_failed')
     and coalesce(auction_row.auction_status, 'draft') in ('cancelled', 'settled') then
    raise exception 'This simulation action is not available for the current auction state.';
  end if;

  case p_action
    when 'simulate_bid' then
      next_amount := public.krunch_next_valid_bid_amount(p_auction_id);
      buy_now_ceiling := auction_row.buy_now_price;

      if auction_row.auction_type = 'hybrid' and buy_now_ceiling is not null then
        next_amount := least(next_amount, buy_now_ceiling - greatest(coalesce(auction_row.minimum_increment, 0), 1));
      end if;

      latest_bid := public.krunch_place_auction_bid(
        p_auction_id,
        next_amount,
        null,
        'admin_demo'
      );

      return jsonb_build_object(
        'action', p_action,
        'bid_id', latest_bid.bid_id,
        'bid_amount', latest_bid.bid_amount
      );

    when 'simulate_last_minute_bid' then
      update public.auctions
      set auction_end_time = timezone('utc'::text, now()) + interval '10 seconds',
          updated_at = timezone('utc'::text, now())
      where auction_id = p_auction_id;

      next_amount := public.krunch_next_valid_bid_amount(p_auction_id);
      if auction_row.auction_type = 'hybrid' and auction_row.buy_now_price is not null then
        next_amount := least(next_amount, auction_row.buy_now_price - greatest(coalesce(auction_row.minimum_increment, 0), 1));
      end if;

      latest_bid := public.krunch_place_auction_bid(
        p_auction_id,
        next_amount,
        null,
        'admin_demo'
      );

      return jsonb_build_object(
        'action', p_action,
        'bid_id', latest_bid.bid_id,
        'bid_amount', latest_bid.bid_amount,
        'extended_to', (select auction_end_time from public.auctions where auction_id = p_auction_id)
      );

    when 'simulate_extension' then
      update public.auctions
      set auction_end_time = coalesce(auction_end_time, timezone('utc'::text, now())) + make_interval(secs => greatest(coalesce(extension_seconds, 30), 1)),
          updated_at = timezone('utc'::text, now())
      where auction_id = p_auction_id;

      return jsonb_build_object(
        'action', p_action,
        'extended_to', (select auction_end_time from public.auctions where auction_id = p_auction_id)
      );

    when 'end_auction_now' then
      select *
      into latest_bid
      from public.auction_bids
      where auction_id = p_auction_id
        and is_valid = true
      order by bid_amount desc, created_at asc
      limit 1;

      update public.auctions
      set auction_status = 'ended',
          auction_end_time = timezone('utc'::text, now()),
          hammer_price = case when latest_bid.bid_id is not null then latest_bid.bid_amount else null end,
          final_price = case when latest_bid.bid_id is not null then latest_bid.bid_amount else null end,
          winner_bidder_id = case when latest_bid.bid_id is not null then latest_bid.bidder_user_id else null end,
          winner_bid_id = latest_bid.bid_id,
          settlement_status = case when latest_bid.bid_id is not null then 'pending' else null end,
          updated_at = timezone('utc'::text, now())
      where auction_id = p_auction_id;

      if latest_bid.bid_id is not null then
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
          latest_bid.bidder_user_id,
          latest_bid.bidder_display_name,
          latest_bid.bid_id,
          'pending_payment',
          timezone('utc'::text, now()) + interval '72 hours',
          true
        )
        on conflict (auction_id) do update
        set winner_user_id = excluded.winner_user_id,
            winner_display_name = excluded.winner_display_name,
            winning_bid_id = excluded.winning_bid_id,
            outcome_status = excluded.outcome_status,
            payment_due_at = excluded.payment_due_at,
            paid_at = null,
            reassigned_from_bid_id = null,
            is_demo = true,
            updated_at = timezone('utc'::text, now());
      end if;

      return jsonb_build_object(
        'action', p_action,
        'winner_bid_id', latest_bid.bid_id,
        'winner_display_name', latest_bid.bidder_display_name,
        'has_winner', (latest_bid.bid_id is not null)
      );

    when 'mark_payment_pending' then
      select *
      into latest_bid
      from public.auction_bids
      where auction_id = p_auction_id
        and is_valid = true
      order by bid_amount desc, created_at asc
      limit 1;

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
        latest_bid.bidder_user_id,
        latest_bid.bidder_display_name,
        latest_bid.bid_id,
        'pending_payment',
        timezone('utc'::text, now()) + interval '72 hours',
        true
      )
      on conflict (auction_id) do update
      set winner_user_id = excluded.winner_user_id,
          winner_display_name = excluded.winner_display_name,
          winning_bid_id = excluded.winning_bid_id,
          outcome_status = excluded.outcome_status,
          payment_due_at = excluded.payment_due_at,
          paid_at = null,
          updated_at = timezone('utc'::text, now());

      return jsonb_build_object('action', p_action, 'status', 'pending_payment');

    when 'mark_payment_failed' then
      insert into public.auction_outcomes (
        auction_id,
        outcome_status,
        is_demo
      )
      values (
        p_auction_id,
        'failed',
        true
      )
      on conflict (auction_id) do update
      set outcome_status = 'failed',
          paid_at = null,
          updated_at = timezone('utc'::text, now());

      return jsonb_build_object('action', p_action, 'status', 'failed');

    when 'reassign_to_underbidder' then
      select winner_user_id, winning_bid_id
      into previous_winner_id, previous_bid_id
      from public.auction_outcomes
      where auction_id = p_auction_id;

      if previous_bid_id is null then
        select winner_bid_id
        into previous_bid_id
        from public.auctions
        where auction_id = p_auction_id;
      end if;

      if previous_bid_id is null then
        select bid_id
        into previous_bid_id
        from public.auction_bids
        where auction_id = p_auction_id
          and is_valid = true
        order by bid_amount desc, created_at asc
        limit 1;
      end if;

      select *
      into second_bid
      from public.auction_bids
      where auction_id = p_auction_id
        and is_valid = true
        and bid_id <> previous_bid_id
      order by bid_amount desc, created_at asc
      limit 1;

      if second_bid.bid_id is null then
        raise exception 'No underbidder is available for reassignment.';
      end if;

      update public.auction_bids
      set is_winning_bid = (bid_id = second_bid.bid_id)
      where auction_id = p_auction_id;

      update public.auctions
      set auction_status = 'ended',
          settlement_status = 'pending',
          winner_bidder_id = second_bid.bidder_user_id,
          winner_bid_id = second_bid.bid_id,
          hammer_price = second_bid.bid_amount,
          final_price = second_bid.bid_amount,
          updated_at = timezone('utc'::text, now())
      where auction_id = p_auction_id;

      insert into public.auction_outcomes (
        auction_id,
        winner_user_id,
        winner_display_name,
        winning_bid_id,
        outcome_status,
        payment_due_at,
        reassigned_from_bid_id,
        is_demo
      )
      values (
        p_auction_id,
        second_bid.bidder_user_id,
        second_bid.bidder_display_name,
        second_bid.bid_id,
        'reassigned',
        timezone('utc'::text, now()) + interval '72 hours',
        previous_bid_id,
        true
      )
      on conflict (auction_id) do update
      set winner_user_id = excluded.winner_user_id,
          winner_display_name = excluded.winner_display_name,
          winning_bid_id = excluded.winning_bid_id,
          outcome_status = excluded.outcome_status,
          payment_due_at = excluded.payment_due_at,
          paid_at = null,
          reassigned_from_bid_id = excluded.reassigned_from_bid_id,
          updated_at = timezone('utc'::text, now());

      return jsonb_build_object(
        'action', p_action,
        'winner_bid_id', second_bid.bid_id,
        'winner_display_name', second_bid.bidder_display_name
      );

    else
      raise exception 'Unsupported simulation action %.', p_action;
  end case;
end;
$$;

alter table if exists public.auction_bids enable row level security;
alter table if exists public.auction_outcomes enable row level security;

drop policy if exists auction_bids_select_public_or_internal on public.auction_bids;
create policy auction_bids_select_public_or_internal
on public.auction_bids
for select
to anon, authenticated
using (
  public.krunch_is_internal_staff()
  or bidder_user_id = auth.uid()
  or exists (
    select 1
    from public.auctions auction
    join public.provenance_artifacts artifact
      on artifact.id = auction.artifact_id
    where auction.auction_id = auction_bids.auction_id
      and artifact.public_visibility = 'public'
      and coalesce(auction.auction_status, 'draft') <> 'draft'
  )
);

drop policy if exists auction_bids_insert_internal_only on public.auction_bids;
create policy auction_bids_insert_internal_only
on public.auction_bids
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists auction_bids_update_internal_only on public.auction_bids;
create policy auction_bids_update_internal_only
on public.auction_bids
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists auction_bids_delete_super_admin on public.auction_bids;
create policy auction_bids_delete_super_admin
on public.auction_bids
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists auction_outcomes_select_internal_or_winner on public.auction_outcomes;
create policy auction_outcomes_select_internal_or_winner
on public.auction_outcomes
for select
to authenticated
using (
  public.krunch_is_internal_staff()
  or winner_user_id = auth.uid()
);

drop policy if exists auction_outcomes_insert_internal_only on public.auction_outcomes;
create policy auction_outcomes_insert_internal_only
on public.auction_outcomes
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists auction_outcomes_update_internal_only on public.auction_outcomes;
create policy auction_outcomes_update_internal_only
on public.auction_outcomes
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists auction_outcomes_delete_super_admin on public.auction_outcomes;
create policy auction_outcomes_delete_super_admin
on public.auction_outcomes
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

grant execute on function public.krunch_next_valid_bid_amount(uuid) to anon, authenticated;
grant execute on function public.krunch_place_auction_bid(uuid, numeric, text, text) to anon, authenticated;
grant execute on function public.krunch_buy_now_auction(uuid, text) to anon, authenticated;
grant execute on function public.krunch_seed_demo_auction_history(uuid, integer) to authenticated;
grant execute on function public.krunch_admin_simulate_auction_action(uuid, text) to authenticated;

comment on table public.auction_bids is
  'Canonical bid ledger for the demo/live auction MVP. Demo flows stay separated via is_demo and bid_source.';

comment on table public.auction_outcomes is
  'Auction settlement/outcome snapshot for winners, payment state, and underbidder reassignment.';

comment on function public.krunch_place_auction_bid(uuid, numeric, text, text) is
  'Validated bid placement with next-bid checks, demo/live separation, and automatic last-minute extension.';

comment on function public.krunch_buy_now_auction(uuid, text) is
  'Hybrid-auction instant purchase path that ends the auction and creates a pending_payment outcome.';

comment on function public.krunch_admin_simulate_auction_action(uuid, text) is
  'Admin-only demo controls: simulate bid, simulate extension, end auction, and payment-state transitions.';

commit;
