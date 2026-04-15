insert into storage.buckets (id, name, public)
values ('media-assets', 'media-assets', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload media-assets'
  ) then
    create policy "Authenticated users can upload media-assets"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'media-assets');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update media-assets'
  ) then
    create policy "Authenticated users can update media-assets"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'media-assets')
      with check (bucket_id = 'media-assets');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete media-assets'
  ) then
    create policy "Authenticated users can delete media-assets"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'media-assets');
  end if;
end
$$;
