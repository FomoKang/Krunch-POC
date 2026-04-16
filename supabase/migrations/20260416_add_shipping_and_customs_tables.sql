create table if not exists public.product_shipping_profiles (
  shipping_profile_code text primary key,
  shipping_profile_name text not null,
  estimated_package_weight_grams integer,
  estimated_package_length_cm numeric,
  estimated_package_width_cm numeric,
  estimated_package_height_cm numeric,
  package_type text check (
    package_type = any (array['soft'::text, 'box'::text, 'premium_box'::text, 'framed'::text, 'electronics'::text, 'special'::text])
  ),
  carrier_preference text check (
    carrier_preference = any (array['dhl'::text, 'fedex'::text, 'ups'::text, 'ems'::text, 'local'::text, 'hand_carry'::text, 'special'::text])
  ),
  ddp_supported boolean not null default false,
  insurance_required boolean not null default false,
  special_handling_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.product_shipping_info (
  artifact_id uuid primary key references public.provenance_artifacts(id) on delete cascade,
  shipping_info_status text not null default 'empty' check (
    shipping_info_status = any (array['empty'::text, 'partial'::text, 'complete'::text])
  ),
  international_sale_status text not null default 'draft' check (
    international_sale_status = any (
      array['draft'::text, 'domestic_only'::text, 'review_required'::text, 'international_ready'::text, 'restricted'::text]
    )
  ),
  manual_review_required boolean not null default false,
  shipping_profile_code text references public.product_shipping_profiles(shipping_profile_code) on update cascade,
  shipping_profile_name text,
  estimated_package_weight_grams integer,
  estimated_package_length_cm numeric,
  estimated_package_width_cm numeric,
  estimated_package_height_cm numeric,
  package_type text check (
    package_type = any (array['soft'::text, 'box'::text, 'premium_box'::text, 'framed'::text, 'electronics'::text, 'special'::text])
  ),
  carrier_preference text check (
    carrier_preference = any (array['dhl'::text, 'fedex'::text, 'ups'::text, 'ems'::text, 'local'::text, 'hand_carry'::text, 'special'::text])
  ),
  ddp_supported boolean not null default false,
  insurance_required boolean not null default false,
  special_handling_required boolean not null default false,
  allowed_destination_countries text[] not null default '{}'::text[],
  restricted_destination_countries text[] not null default '{}'::text[],
  restricted_reason text,
  brokerage_fee_policy text not null default 'manual' check (
    brokerage_fee_policy = any (array['included'::text, 'excluded'::text, 'manual'::text])
  ),
  ddp_mode text not null default 'none' check (
    ddp_mode = any (array['none'::text, 'available'::text, 'required'::text])
  ),
  customs_risk_tier text not null default 'medium' check (
    customs_risk_tier = any (array['low'::text, 'medium'::text, 'high'::text])
  ),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.product_customs_info (
  artifact_id uuid primary key references public.provenance_artifacts(id) on delete cascade,
  customs_info_status text not null default 'empty' check (
    customs_info_status = any (array['empty'::text, 'partial'::text, 'complete'::text])
  ),
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
  customs_notes_internal text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists product_shipping_info_international_sale_status_idx
  on public.product_shipping_info (international_sale_status);

create index if not exists product_shipping_info_shipping_profile_code_idx
  on public.product_shipping_info (shipping_profile_code);

create index if not exists product_customs_info_country_of_origin_idx
  on public.product_customs_info (country_of_origin);

insert into public.product_shipping_profiles (
  shipping_profile_code,
  shipping_profile_name,
  estimated_package_weight_grams,
  estimated_package_length_cm,
  estimated_package_width_cm,
  estimated_package_height_cm,
  package_type,
  carrier_preference,
  ddp_supported,
  insurance_required,
  special_handling_required
)
values
  ('apparel_basic', 'Apparel Basic', 700, 38, 28, 6, 'soft', 'dhl', false, false, false),
  ('apparel_premium_box', 'Apparel Premium Box', 1300, 42, 34, 10, 'premium_box', 'fedex', true, true, false),
  ('apparel_framed', 'Apparel Framed', 2600, 78, 58, 10, 'framed', 'ups', true, true, true),
  ('md_small', 'MD Small Parcel', 450, 24, 18, 9, 'box', 'ems', false, false, false),
  ('electronics_addon', 'Electronics Add-on', 900, 28, 20, 10, 'electronics', 'fedex', true, true, true)
on conflict (shipping_profile_code) do update
set
  shipping_profile_name = excluded.shipping_profile_name,
  estimated_package_weight_grams = excluded.estimated_package_weight_grams,
  estimated_package_length_cm = excluded.estimated_package_length_cm,
  estimated_package_width_cm = excluded.estimated_package_width_cm,
  estimated_package_height_cm = excluded.estimated_package_height_cm,
  package_type = excluded.package_type,
  carrier_preference = excluded.carrier_preference,
  ddp_supported = excluded.ddp_supported,
  insurance_required = excluded.insurance_required,
  special_handling_required = excluded.special_handling_required,
  is_active = true,
  updated_at = timezone('utc'::text, now());

alter table public.product_shipping_profiles enable row level security;
alter table public.product_shipping_info enable row level security;
alter table public.product_customs_info enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_shipping_profiles'
      and policyname = 'product_shipping_profiles_authenticated_read'
  ) then
    create policy "product_shipping_profiles_authenticated_read"
      on public.product_shipping_profiles
      for select
      to authenticated
      using (is_active = true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_shipping_info'
      and policyname = 'product_shipping_info_owner_select'
  ) then
    create policy "product_shipping_info_owner_select"
      on public.product_shipping_info
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_shipping_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_shipping_info'
      and policyname = 'product_shipping_info_owner_insert'
  ) then
    create policy "product_shipping_info_owner_insert"
      on public.product_shipping_info
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_shipping_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_shipping_info'
      and policyname = 'product_shipping_info_owner_update'
  ) then
    create policy "product_shipping_info_owner_update"
      on public.product_shipping_info
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_shipping_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_shipping_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_shipping_info'
      and policyname = 'product_shipping_info_owner_delete'
  ) then
    create policy "product_shipping_info_owner_delete"
      on public.product_shipping_info
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_shipping_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_customs_info'
      and policyname = 'product_customs_info_owner_select'
  ) then
    create policy "product_customs_info_owner_select"
      on public.product_customs_info
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_customs_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_customs_info'
      and policyname = 'product_customs_info_owner_insert'
  ) then
    create policy "product_customs_info_owner_insert"
      on public.product_customs_info
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_customs_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_customs_info'
      and policyname = 'product_customs_info_owner_update'
  ) then
    create policy "product_customs_info_owner_update"
      on public.product_customs_info
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_customs_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_customs_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_customs_info'
      and policyname = 'product_customs_info_owner_delete'
  ) then
    create policy "product_customs_info_owner_delete"
      on public.product_customs_info
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.provenance_artifacts artifacts
          where artifacts.id = product_customs_info.artifact_id
            and artifacts.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;
