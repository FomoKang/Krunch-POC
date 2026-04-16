-- Krunch role-based access control and practical RLS baseline
-- This migration intentionally prefers a conservative default:
-- - anonymous users only see explicitly public records
-- - authenticated users only see their own profile/role rows plus public data
-- - internal roles unlock operational data by responsibility
-- Bootstrap note:
-- - seed the first super_admin manually in SQL Editor or with the service role
--   before expecting internal policies to grant broader access.

begin;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (user_id, role),
  constraint user_roles_role_check check (
    role = any (
      array[
        'user'::text,
        'admin'::text,
        'ops'::text,
        'inspector'::text,
        'finance'::text,
        'super_admin'::text
      ]
    )
  )
);

create index if not exists user_roles_role_user_id_idx
  on public.user_roles (role, user_id);

alter table public.user_roles enable row level security;

create or replace function public.krunch_has_role(
  p_role text,
  p_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with effective_user as (
    select coalesce(p_user_id, auth.uid()) as user_id
  ),
  normalized_role as (
    select lower(btrim(coalesce(p_role, ''))) as role_name
  )
  select case
    when (select user_id from effective_user) is null then false
    when (select role_name from normalized_role) = '' then false
    when (select role_name from normalized_role) = 'user' then true
    else exists (
      select 1
      from public.user_roles roles
      where roles.user_id = (select user_id from effective_user)
        and roles.role = (select role_name from normalized_role)
    )
  end
$$;

create or replace function public.krunch_has_any_role(
  p_roles text[],
  p_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with effective_user as (
    select coalesce(p_user_id, auth.uid()) as user_id
  ),
  normalized_roles as (
    select coalesce(array_agg(lower(btrim(role_name))), '{}'::text[]) as role_names
    from unnest(coalesce(p_roles, '{}'::text[])) as role_name
    where btrim(role_name) <> ''
  )
  select case
    when (select user_id from effective_user) is null then false
    when 'user' = any (coalesce((select role_names from normalized_roles), '{}'::text[])) then true
    else exists (
      select 1
      from public.user_roles roles
      where roles.user_id = (select user_id from effective_user)
        and roles.role = any (coalesce((select role_names from normalized_roles), '{}'::text[]))
    )
  end
$$;

create or replace function public.krunch_is_internal_staff(
  p_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.krunch_has_any_role(
    array['admin', 'ops', 'inspector', 'finance', 'super_admin'],
    p_user_id
  )
$$;

create or replace function public.krunch_can_read_visibility(
  p_visibility text,
  p_owner_user_id uuid default null,
  p_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with effective_user as (
    select coalesce(p_user_id, auth.uid()) as user_id
  ),
  normalized_visibility as (
    select coalesce(lower(btrim(p_visibility)), 'internal_only') as visibility_level
  )
  select case
    when (select visibility_level from normalized_visibility) = 'public' then true
    when (select user_id from effective_user) is null then false
    when p_owner_user_id is not null and p_owner_user_id = (select user_id from effective_user) then true
    when public.krunch_is_internal_staff((select user_id from effective_user)) then true
    else false
  end
$$;

comment on table public.user_roles is
  'Many-to-many internal role assignments for Krunch operators. Authenticated users implicitly behave as role user.';

comment on function public.krunch_has_role(text, uuid) is
  'Role helper for RLS. The user role is treated as the implicit baseline for authenticated sessions.';

comment on function public.krunch_can_read_visibility(text, uuid, uuid) is
  'Conservative visibility helper: public for all, collector/internal only for internal staff or the owning user.';

revoke all on function public.krunch_insert_audit_log(text, text, text, jsonb, jsonb, uuid, text, jsonb) from public;
revoke all on function public.krunch_insert_audit_log(text, text, text, jsonb, jsonb, uuid, text, jsonb) from anon;
revoke all on function public.krunch_insert_audit_log(text, text, text, jsonb, jsonb, uuid, text, jsonb) from authenticated;

revoke all on function public.krunch_audit_row_change() from public;
revoke all on function public.krunch_audit_row_change() from anon;
revoke all on function public.krunch_audit_row_change() from authenticated;

alter table if exists public.profiles enable row level security;
alter table if exists public.provenance_artifacts enable row level security;
alter table if exists public.provenance_events enable row level security;
alter table if exists public.provenance_authentications enable row level security;
alter table if exists public.auctions enable row level security;
alter table if exists public.bid_history enable row level security;
alter table if exists public.certificates enable row level security;
alter table if exists public.ownership_chain enable row level security;
alter table if exists public.media_assets enable row level security;
alter table if exists public.product_shipping_profiles enable row level security;
alter table if exists public.product_shipping_info enable row level security;
alter table if exists public.product_customs_info enable row level security;
alter table if exists public.provenance_transactions enable row level security;
alter table if exists public.audit_logs enable row level security;

drop policy if exists profiles_select_internal_admin on public.profiles;
create policy profiles_select_internal_admin
on public.profiles
for select
to authenticated
using (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists profiles_update_super_admin on public.profiles;
create policy profiles_update_super_admin
on public.profiles
for update
to authenticated
using (public.krunch_has_role('super_admin'))
with check (public.krunch_has_role('super_admin'));

drop policy if exists user_roles_select_self_or_internal on public.user_roles;
create policy user_roles_select_self_or_internal
on public.user_roles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.krunch_has_any_role(array['admin', 'super_admin'])
);

drop policy if exists user_roles_insert_super_admin on public.user_roles;
create policy user_roles_insert_super_admin
on public.user_roles
for insert
to authenticated
with check (public.krunch_has_role('super_admin'));

drop policy if exists user_roles_update_super_admin on public.user_roles;
create policy user_roles_update_super_admin
on public.user_roles
for update
to authenticated
using (public.krunch_has_role('super_admin'))
with check (public.krunch_has_role('super_admin'));

drop policy if exists user_roles_delete_super_admin on public.user_roles;
create policy user_roles_delete_super_admin
on public.user_roles
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists provenance_artifacts_public_read on public.provenance_artifacts;
drop policy if exists provenance_artifacts_select_role_based on public.provenance_artifacts;
create policy provenance_artifacts_select_role_based
on public.provenance_artifacts
for select
to anon, authenticated
using (public.krunch_can_read_visibility(public_visibility, owner_user_id));

drop policy if exists provenance_artifacts_insert_admin on public.provenance_artifacts;
create policy provenance_artifacts_insert_admin
on public.provenance_artifacts
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists provenance_artifacts_update_admin on public.provenance_artifacts;
create policy provenance_artifacts_update_admin
on public.provenance_artifacts
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists provenance_artifacts_delete_super_admin on public.provenance_artifacts;
create policy provenance_artifacts_delete_super_admin
on public.provenance_artifacts
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists provenance_events_select_role_based on public.provenance_events;
create policy provenance_events_select_role_based
on public.provenance_events
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = provenance_events.artifact_id
      and public.krunch_can_read_visibility(artifact.public_visibility, artifact.owner_user_id)
      and public.krunch_can_read_visibility(
        coalesce(provenance_events.visibility_level, artifact.public_visibility),
        artifact.owner_user_id
      )
  )
);

drop policy if exists provenance_events_insert_inspector on public.provenance_events;
create policy provenance_events_insert_inspector
on public.provenance_events
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists provenance_events_update_inspector on public.provenance_events;
create policy provenance_events_update_inspector
on public.provenance_events
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists provenance_events_delete_super_admin on public.provenance_events;
create policy provenance_events_delete_super_admin
on public.provenance_events
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists provenance_authentications_select_role_based on public.provenance_authentications;
create policy provenance_authentications_select_role_based
on public.provenance_authentications
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = provenance_authentications.artifact_id
      and public.krunch_can_read_visibility(artifact.public_visibility, artifact.owner_user_id)
      and public.krunch_can_read_visibility(
        coalesce(provenance_authentications.visibility_level, artifact.public_visibility),
        artifact.owner_user_id
      )
  )
);

drop policy if exists provenance_authentications_insert_inspector on public.provenance_authentications;
create policy provenance_authentications_insert_inspector
on public.provenance_authentications
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists provenance_authentications_update_inspector on public.provenance_authentications;
create policy provenance_authentications_update_inspector
on public.provenance_authentications
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists provenance_authentications_delete_super_admin on public.provenance_authentications;
create policy provenance_authentications_delete_super_admin
on public.provenance_authentications
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists auctions_select_role_based on public.auctions;
create policy auctions_select_role_based
on public.auctions
for select
to anon, authenticated
using (
  public.krunch_is_internal_staff()
  or exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = auctions.artifact_id
      and artifact.public_visibility = 'public'
      and coalesce(auctions.auction_status, 'draft') <> 'draft'
  )
  or exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = auctions.artifact_id
      and artifact.owner_user_id = auth.uid()
  )
);

drop policy if exists auctions_insert_admin on public.auctions;
create policy auctions_insert_admin
on public.auctions
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists auctions_update_admin on public.auctions;
create policy auctions_update_admin
on public.auctions
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists auctions_delete_super_admin on public.auctions;
create policy auctions_delete_super_admin
on public.auctions
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists bid_history_select_own_or_internal on public.bid_history;
create policy bid_history_select_own_or_internal
on public.bid_history
for select
to authenticated
using (
  bidder_id = auth.uid()
  or public.krunch_is_internal_staff()
);

drop policy if exists bid_history_insert_own_or_internal on public.bid_history;
create policy bid_history_insert_own_or_internal
on public.bid_history
for insert
to authenticated
with check (
  bidder_id = auth.uid()
  or public.krunch_is_internal_staff()
);

drop policy if exists bid_history_update_super_admin on public.bid_history;
create policy bid_history_update_super_admin
on public.bid_history
for update
to authenticated
using (public.krunch_has_role('super_admin'))
with check (public.krunch_has_role('super_admin'));

drop policy if exists bid_history_delete_super_admin on public.bid_history;
create policy bid_history_delete_super_admin
on public.bid_history
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists certificates_select_owner_or_inspector on public.certificates;
create policy certificates_select_owner_or_inspector
on public.certificates
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.krunch_has_any_role(array['admin', 'inspector', 'super_admin'])
);

drop policy if exists certificates_insert_inspector on public.certificates;
create policy certificates_insert_inspector
on public.certificates
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists certificates_update_inspector on public.certificates;
create policy certificates_update_inspector
on public.certificates
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'inspector', 'super_admin']));

drop policy if exists certificates_delete_super_admin on public.certificates;
create policy certificates_delete_super_admin
on public.certificates
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists ownership_chain_select_internal on public.ownership_chain;
create policy ownership_chain_select_internal
on public.ownership_chain
for select
to authenticated
using (public.krunch_is_internal_staff());

drop policy if exists ownership_chain_insert_admin on public.ownership_chain;
create policy ownership_chain_insert_admin
on public.ownership_chain
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists ownership_chain_update_admin on public.ownership_chain;
create policy ownership_chain_update_admin
on public.ownership_chain
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'super_admin']));

drop policy if exists ownership_chain_delete_super_admin on public.ownership_chain;
create policy ownership_chain_delete_super_admin
on public.ownership_chain
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists media_assets_public_read on public.media_assets;
drop policy if exists media_assets_select_role_based on public.media_assets;
create policy media_assets_select_role_based
on public.media_assets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = media_assets.artifact_id
      and public.krunch_can_read_visibility(
        coalesce(media_assets.visibility_level, artifact.public_visibility),
        artifact.owner_user_id
      )
  )
);

drop policy if exists media_assets_insert_internal on public.media_assets;
create policy media_assets_insert_internal
on public.media_assets
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'inspector', 'super_admin']));

drop policy if exists media_assets_update_internal on public.media_assets;
create policy media_assets_update_internal
on public.media_assets
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'inspector', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'inspector', 'super_admin']));

drop policy if exists media_assets_delete_super_admin on public.media_assets;
create policy media_assets_delete_super_admin
on public.media_assets
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists product_shipping_profiles_authenticated_read on public.product_shipping_profiles;
drop policy if exists product_shipping_profiles_select_internal on public.product_shipping_profiles;
create policy product_shipping_profiles_select_internal
on public.product_shipping_profiles
for select
to authenticated
using (public.krunch_is_internal_staff());

drop policy if exists product_shipping_profiles_insert_ops on public.product_shipping_profiles;
create policy product_shipping_profiles_insert_ops
on public.product_shipping_profiles
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_shipping_profiles_update_ops on public.product_shipping_profiles;
create policy product_shipping_profiles_update_ops
on public.product_shipping_profiles
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_shipping_profiles_delete_super_admin on public.product_shipping_profiles;
create policy product_shipping_profiles_delete_super_admin
on public.product_shipping_profiles
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists product_shipping_info_owner_select on public.product_shipping_info;
drop policy if exists product_shipping_info_owner_insert on public.product_shipping_info;
drop policy if exists product_shipping_info_owner_update on public.product_shipping_info;
drop policy if exists product_shipping_info_owner_delete on public.product_shipping_info;
drop policy if exists product_shipping_info_select_ops on public.product_shipping_info;
create policy product_shipping_info_select_ops
on public.product_shipping_info
for select
to authenticated
using (
  public.krunch_has_any_role(array['admin', 'ops', 'super_admin'])
  or exists (
    select 1
    from public.provenance_artifacts artifact
    where artifact.id = product_shipping_info.artifact_id
      and artifact.owner_user_id = auth.uid()
  )
);

drop policy if exists product_shipping_info_insert_ops on public.product_shipping_info;
create policy product_shipping_info_insert_ops
on public.product_shipping_info
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_shipping_info_update_ops on public.product_shipping_info;
create policy product_shipping_info_update_ops
on public.product_shipping_info
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_shipping_info_delete_super_admin on public.product_shipping_info;
create policy product_shipping_info_delete_super_admin
on public.product_shipping_info
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists product_customs_info_owner_select on public.product_customs_info;
drop policy if exists product_customs_info_owner_insert on public.product_customs_info;
drop policy if exists product_customs_info_owner_update on public.product_customs_info;
drop policy if exists product_customs_info_owner_delete on public.product_customs_info;
drop policy if exists product_customs_info_select_ops on public.product_customs_info;
create policy product_customs_info_select_ops
on public.product_customs_info
for select
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_customs_info_insert_ops on public.product_customs_info;
create policy product_customs_info_insert_ops
on public.product_customs_info
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_customs_info_update_ops on public.product_customs_info;
create policy product_customs_info_update_ops
on public.product_customs_info
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'ops', 'super_admin']));

drop policy if exists product_customs_info_delete_super_admin on public.product_customs_info;
create policy product_customs_info_delete_super_admin
on public.product_customs_info
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists provenance_transactions_select_finance on public.provenance_transactions;
create policy provenance_transactions_select_finance
on public.provenance_transactions
for select
to authenticated
using (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']));

drop policy if exists provenance_transactions_insert_finance on public.provenance_transactions;
create policy provenance_transactions_insert_finance
on public.provenance_transactions
for insert
to authenticated
with check (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']));

drop policy if exists provenance_transactions_update_finance on public.provenance_transactions;
create policy provenance_transactions_update_finance
on public.provenance_transactions
for update
to authenticated
using (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']))
with check (public.krunch_has_any_role(array['admin', 'finance', 'super_admin']));

drop policy if exists provenance_transactions_delete_super_admin on public.provenance_transactions;
create policy provenance_transactions_delete_super_admin
on public.provenance_transactions
for delete
to authenticated
using (public.krunch_has_role('super_admin'));

drop policy if exists audit_logs_select_internal on public.audit_logs;
create policy audit_logs_select_internal
on public.audit_logs
for select
to authenticated
using (public.krunch_has_any_role(array['admin', 'ops', 'inspector', 'finance', 'super_admin']));

-- Current schema does not yet expose dedicated settlements / payments / refunds tables.
-- Mirror the provenance_transactions finance policies above when those tables are added.

commit;
