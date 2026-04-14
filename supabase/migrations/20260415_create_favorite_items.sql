create table if not exists public.favorite_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, item_id)
);

alter table public.favorite_items enable row level security;

create policy "favorite_items_select_own"
on public.favorite_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "favorite_items_insert_own"
on public.favorite_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "favorite_items_delete_own"
on public.favorite_items
for delete
to authenticated
using (auth.uid() = user_id);
