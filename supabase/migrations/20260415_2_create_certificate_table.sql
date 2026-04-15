create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  certificate_id text not null,
  artifact_id uuid not null references public.provenance_artifacts (id) on delete cascade,
  auth_id uuid references public.provenance_authentications (id) on delete set null,
  certificate_code text not null,
  certificate_type text check (certificate_type in ('krunch_certified', 'dna_verified', 'provenance_verified', 'market_verified')),
  issued_at timestamptz,
  revoked_at timestamptz,
  status text not null check (status in ('active', 'superseded', 'revoked')),
  public_url text,
  qr_payload text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id, certificate_id),
  unique (owner_user_id, certificate_code)
);

create index if not exists certificates_owner_user_id_idx
on public.certificates (owner_user_id);

create index if not exists certificates_artifact_id_idx
on public.certificates (artifact_id);

alter table public.certificates enable row level security;

drop policy if exists "certificates_select_own" on public.certificates;
drop policy if exists "certificates_insert_own" on public.certificates;
drop policy if exists "certificates_update_own" on public.certificates;

create policy "certificates_select_own"
on public.certificates
for select
to authenticated
using (auth.uid() = owner_user_id);

create policy "certificates_insert_own"
on public.certificates
for insert
to authenticated
with check (auth.uid() = owner_user_id);

create policy "certificates_update_own"
on public.certificates
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);
