-- Georgian Ceramics — admin panel schema
-- Safe to run the whole file more than once (every statement is idempotent).

create extension if not exists pgcrypto;

-- ============ TABLES ============

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  price numeric(10,2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_subcategories (
  product_id uuid not null references products(id) on delete cascade,
  subcategory_id uuid not null references subcategories(id) on delete cascade,
  primary key (product_id, subcategory_id)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

create index if not exists idx_subcategories_category on subcategories(category_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_product_subcategories_sub on product_subcategories(subcategory_id);

-- ============ RLS ============

alter table categories enable row level security;
alter table subcategories enable row level security;
alter table products enable row level security;
alter table product_subcategories enable row level security;
alter table product_images enable row level security;

-- public website: read-only
drop policy if exists "anon_select_categories" on categories;
create policy "anon_select_categories" on categories for select to anon using (true);
drop policy if exists "anon_select_subcategories" on subcategories;
create policy "anon_select_subcategories" on subcategories for select to anon using (true);
drop policy if exists "anon_select_products" on products;
create policy "anon_select_products" on products for select to anon using (true);
drop policy if exists "anon_select_product_subcategories" on product_subcategories;
create policy "anon_select_product_subcategories" on product_subcategories for select to anon using (true);
drop policy if exists "anon_select_product_images" on product_images;
create policy "anon_select_product_images" on product_images for select to anon using (true);

-- admin panel (logged in via Supabase Auth): full access
drop policy if exists "auth_select_categories" on categories;
create policy "auth_select_categories" on categories for select to authenticated using (true);
drop policy if exists "auth_insert_categories" on categories;
create policy "auth_insert_categories" on categories for insert to authenticated with check (true);
drop policy if exists "auth_update_categories" on categories;
create policy "auth_update_categories" on categories for update to authenticated using (true) with check (true);
drop policy if exists "auth_delete_categories" on categories;
create policy "auth_delete_categories" on categories for delete to authenticated using (true);

drop policy if exists "auth_select_subcategories" on subcategories;
create policy "auth_select_subcategories" on subcategories for select to authenticated using (true);
drop policy if exists "auth_insert_subcategories" on subcategories;
create policy "auth_insert_subcategories" on subcategories for insert to authenticated with check (true);
drop policy if exists "auth_update_subcategories" on subcategories;
create policy "auth_update_subcategories" on subcategories for update to authenticated using (true) with check (true);
drop policy if exists "auth_delete_subcategories" on subcategories;
create policy "auth_delete_subcategories" on subcategories for delete to authenticated using (true);

drop policy if exists "auth_select_products" on products;
create policy "auth_select_products" on products for select to authenticated using (true);
drop policy if exists "auth_insert_products" on products;
create policy "auth_insert_products" on products for insert to authenticated with check (true);
drop policy if exists "auth_update_products" on products;
create policy "auth_update_products" on products for update to authenticated using (true) with check (true);
drop policy if exists "auth_delete_products" on products;
create policy "auth_delete_products" on products for delete to authenticated using (true);

drop policy if exists "auth_select_product_subcategories" on product_subcategories;
create policy "auth_select_product_subcategories" on product_subcategories for select to authenticated using (true);
drop policy if exists "auth_insert_product_subcategories" on product_subcategories;
create policy "auth_insert_product_subcategories" on product_subcategories for insert to authenticated with check (true);
drop policy if exists "auth_delete_product_subcategories" on product_subcategories;
create policy "auth_delete_product_subcategories" on product_subcategories for delete to authenticated using (true);

drop policy if exists "auth_select_product_images" on product_images;
create policy "auth_select_product_images" on product_images for select to authenticated using (true);
drop policy if exists "auth_insert_product_images" on product_images;
create policy "auth_insert_product_images" on product_images for insert to authenticated with check (true);
drop policy if exists "auth_update_product_images" on product_images;
create policy "auth_update_product_images" on product_images for update to authenticated using (true) with check (true);
drop policy if exists "auth_delete_product_images" on product_images;
create policy "auth_delete_product_images" on product_images for delete to authenticated using (true);

-- ============ STORAGE ============
-- Create bucket manually first: Dashboard → Storage → New bucket → name "product-images" → Public: ON.
-- Then run the policies below.

drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images" on storage.objects
  for select to public using (bucket_id = 'product-images');

drop policy if exists "auth_upload_product_images" on storage.objects;
create policy "auth_upload_product_images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "auth_update_product_images_storage" on storage.objects;
create policy "auth_update_product_images_storage" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "auth_delete_product_images_storage" on storage.objects;
create policy "auth_delete_product_images_storage" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ============ REALTIME ============
-- Lets the public website auto-refresh the moment the admin panel changes data.
do $$
begin
  alter publication supabase_realtime add table categories;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table subcategories;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table products;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table product_images;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table product_subcategories;
exception when duplicate_object then null;
end $$;
