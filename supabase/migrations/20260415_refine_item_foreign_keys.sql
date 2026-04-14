-- Make item relationships explicit for the Supabase schema visualizer.
-- Keeps the current text-based item identifiers used by the frontend.

with referenced_item_ids as (
  select item_id from public.favorite_items
  union
  select item_id from public.auction_participations
  union
  select item_id from public.owned_items
  union
  select item_id from public.viewed_items
),
missing_items as (
  select referenced_item_ids.item_id
  from referenced_item_ids
  left join public.items on public.items.id = referenced_item_ids.item_id
  where referenced_item_ids.item_id is not null
    and public.items.id is null
)
insert into public.items (
  id,
  title,
  artist_name,
  category,
  auction_status,
  current_price,
  image_url
)
select
  item_id,
  item_id,
  'KRUNCH',
  'hybrid_auction',
  'coming_soon',
  null,
  null
from missing_items
on conflict (id) do nothing;

do $$
declare
  relation record;
  existing_constraint text;
begin
  for relation in
    select *
    from (
      values
        ('public.favorite_items', 'favorite_items_item_id_fkey'),
        ('public.auction_participations', 'auction_participations_item_id_fkey'),
        ('public.owned_items', 'owned_items_item_id_fkey'),
        ('public.viewed_items', 'viewed_items_item_id_fkey')
    ) as relation_config(table_name, constraint_name)
  loop
    select constraint_info.conname
    into existing_constraint
    from pg_constraint as constraint_info
    join pg_attribute as local_attribute
      on local_attribute.attrelid = constraint_info.conrelid
      and local_attribute.attnum = any(constraint_info.conkey)
    join pg_attribute as foreign_attribute
      on foreign_attribute.attrelid = constraint_info.confrelid
      and foreign_attribute.attnum = any(constraint_info.confkey)
    where constraint_info.contype = 'f'
      and constraint_info.conrelid = relation.table_name::regclass
      and constraint_info.confrelid = 'public.items'::regclass
      and local_attribute.attname = 'item_id'
      and foreign_attribute.attname = 'id'
    limit 1;

    if existing_constraint is null then
      execute format(
        'alter table %s add constraint %I foreign key (item_id) references public.items (id) on delete cascade not valid',
        relation.table_name::regclass,
        relation.constraint_name
      );

      existing_constraint := relation.constraint_name;
    end if;

    execute format(
      'alter table %s validate constraint %I',
      relation.table_name::regclass,
      existing_constraint
    );

    execute format(
      'comment on constraint %I on %s is %L',
      existing_constraint,
      relation.table_name::regclass,
      'Connects user activity records to the canonical items.id catalog key.'
    );
  end loop;
end $$;

create index if not exists favorite_items_item_id_idx
  on public.favorite_items (item_id);

create index if not exists auction_participations_item_id_idx
  on public.auction_participations (item_id);

create index if not exists owned_items_item_id_idx
  on public.owned_items (item_id);

create index if not exists viewed_items_item_id_idx
  on public.viewed_items (item_id);
