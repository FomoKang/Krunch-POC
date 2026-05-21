alter table if exists public.auctions
  add column if not exists storefront_visible boolean not null default true,
  add column if not exists deleted_at timestamptz;

alter table if exists public.auctions
  drop constraint if exists auctions_auction_status_check,
  drop constraint if exists auctions_auction_status_v1_check;

alter table if exists public.auctions
  add constraint auctions_auction_status_v1_check
    check (
      auction_status is null
      or auction_status = any (
        array[
          'draft'::text,
          'scheduled'::text,
          'published'::text,
          'open'::text,
          'live'::text,
          'ended'::text,
          'settled'::text,
          'cancelled'::text,
          'deleted'::text
        ]
      )
    ) not valid;

create index if not exists auctions_storefront_hybrid_visibility_idx
on public.auctions (auction_type, storefront_visible, demo_mode, auction_status, created_at desc)
where deleted_at is null;

drop policy if exists auctions_select_storefront_hybrid_visible on public.auctions;
create policy auctions_select_storefront_hybrid_visible
on public.auctions
for select
to anon, authenticated
using (
  coalesce(storefront_visible, true) = true
  and deleted_at is null
  and coalesce(auction_status, 'draft') <> 'deleted'
  and auction_type = 'hybrid'
  and exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = auctions.artifact_id
      and artifact.public_visibility = 'public'
  )
  and (
    auction_status in ('live', 'open', 'scheduled', 'published')
    or (coalesce(demo_mode, false) = true and auction_status = 'draft')
  )
);

drop policy if exists auctions_delete_demo_admin on public.auctions;
create policy auctions_delete_demo_admin
on public.auctions
for delete
to authenticated
using (
  public.krunch_has_any_role(array['admin', 'super_admin'])
  and coalesce(demo_mode, false) = true
  and coalesce(auction_status, 'draft') not in ('live', 'settled')
  and winner_bidder_id is null
  and winner_bid_id is null
);
