alter table public.provenance_artifacts enable row level security;
alter table public.media_assets enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'provenance_artifacts'
      and policyname = 'provenance_artifacts_public_read'
  ) then
    create policy "provenance_artifacts_public_read"
      on public.provenance_artifacts
      for select
      to anon, authenticated
      using (public_visibility = 'public');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'media_assets'
      and policyname = 'media_assets_public_read'
  ) then
    create policy "media_assets_public_read"
      on public.media_assets
      for select
      to anon, authenticated
      using (visibility_level = 'public');
  end if;
end
$$;
