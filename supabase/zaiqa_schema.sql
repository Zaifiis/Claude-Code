-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Zaiqa Line — Supabase / Postgres schema, seed data & 5-min rule  ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: it drops & recreates the Zaiqa objects only.

create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────────────

create table if not exists menu_items (
  id       text    primary key,          -- e.g. "b1"
  name_en  text    not null,
  name_ur  text    not null,
  price    integer not null,             -- Rs
  category text    not null
);

create table if not exists orders (
  id            uuid    primary key default gen_random_uuid(),
  order_no      text    unique not null,   -- e.g. "ZQ-1041"
  customer_name text    not null,
  customer_phone text   not null,
  items         jsonb   not null,          -- [{id, qty}]
  total         integer not null,
  status        text    not null default 'new',  -- new|preparing|ready|completed|cancelled
  edited        boolean default false,
  created_at    timestamptz not null default now()
);

create index if not exists orders_order_no_idx on orders (order_no);
create index if not exists orders_phone_idx    on orders (customer_phone);

-- ── The 5-minute edit window, enforced in the DATABASE layer ────────
-- Any UPDATE to an order (modify or cancel) is rejected once the order
-- is older than 5 minutes. This cannot be talked around by the AI or
-- any client, because Postgres itself refuses the write.
--
-- We allow the kitchen's own status progression (new -> preparing ->
-- ready -> completed) at any time; the 5-minute lock applies only to
-- *customer-facing* edits: changing items/total, or cancelling.

create or replace function enforce_order_edit_window()
returns trigger
language plpgsql
as $$
declare
  is_customer_edit boolean;
begin
  -- A "customer edit" = items changed, total changed, or a cancel.
  is_customer_edit :=
        (new.items  is distinct from old.items)
     or (new.total  is distinct from old.total)
     or (new.status = 'cancelled' and old.status <> 'cancelled');

  if is_customer_edit and (now() - old.created_at) > interval '5 minutes' then
    raise exception
      'EDIT_WINDOW_EXPIRED: order % can no longer be modified or cancelled (older than 5 minutes)',
      old.order_no
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_order_edit_window on orders;
create trigger trg_enforce_order_edit_window
  before update on orders
  for each row
  execute function enforce_order_edit_window();

-- ── Human-friendly order numbers: ZQ-1000, ZQ-1001, ... ─────────────
create sequence if not exists zaiqa_order_seq start with 1041;

create or replace function next_order_no()
returns text
language sql
as $$
  select 'ZQ-' || nextval('zaiqa_order_seq')::text;
$$;

-- ── Realtime: let the kitchen dashboard subscribe to order changes ──
alter table orders replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;

-- ── Seed menu (sample Pakistani restaurant) ─────────────────────────
insert into menu_items (id, name_en, name_ur, price, category) values
  -- Biryani & Rice
  ('b1', 'Chicken Biryani',        'چکن بریانی',        450, 'Biryani'),
  ('b2', 'Beef Biryani',           'بیف بریانی',         520, 'Biryani'),
  ('b3', 'Sindhi Biryani',         'سندھی بریانی',       500, 'Biryani'),
  ('b4', 'Chicken Pulao',          'چکن پلاؤ',          400, 'Biryani'),
  -- Karahi & Curry
  ('k1', 'Chicken Karahi (Half)',  'چکن کڑاہی (ہاف)',   850, 'Karahi'),
  ('k2', 'Chicken Karahi (Full)',  'چکن کڑاہی (فل)',   1550, 'Karahi'),
  ('k3', 'Mutton Karahi (Half)',   'مٹن کڑاہی (ہاف)',  1350, 'Karahi'),
  ('k4', 'Daal Makhani',           'دال مکھنی',         350, 'Karahi'),
  -- Grill & BBQ
  ('g1', 'Chicken Tikka',          'چکن تکہ',           320, 'Grill'),
  ('g2', 'Seekh Kabab (4 pcs)',    'سیخ کباب',          380, 'Grill'),
  ('g3', 'Malai Boti',             'ملائی بوٹی',         420, 'Grill'),
  ('g4', 'Chicken Reshmi Kabab',   'چکن ریشمی کباب',    400, 'Grill'),
  -- Tandoor / Breads
  ('t1', 'Roghni Naan',            'روغنی نان',           60, 'Tandoor'),
  ('t2', 'Garlic Naan',            'گارلک نان',           90, 'Tandoor'),
  ('t3', 'Tandoori Roti',          'تندوری روٹی',         30, 'Tandoor'),
  ('t4', 'Cheese Naan',            'چیز نان',           150, 'Tandoor'),
  -- Sides
  ('s1', 'Raita',                  'رائتہ',              80, 'Sides'),
  ('s2', 'Kachumar Salad',         'کچومر سلاد',         120, 'Sides'),
  ('s3', 'Fresh Fries',            'فرائز',              180, 'Sides'),
  -- Sweets
  ('d1', 'Gulab Jamun (2 pcs)',    'گلاب جامن',          150, 'Sweets'),
  ('d2', 'Kheer',                  'کھیر',              180, 'Sweets'),
  ('d3', 'Gajar Halwa',            'گاجر حلوہ',          220, 'Sweets'),
  -- Drinks
  ('r1', 'Mint Margarita',         'منٹ مارگریٹا',       200, 'Drinks'),
  ('r2', 'Sweet Lassi',            'میٹھی لسی',          180, 'Drinks'),
  ('r3', 'Soft Drink (Regular)',   'سافٹ ڈرنک',          90, 'Drinks'),
  ('r4', 'Fresh Lime Water',       'تازہ لیموں پانی',    120, 'Drinks')
on conflict (id) do update set
  name_en  = excluded.name_en,
  name_ur  = excluded.name_ur,
  price    = excluded.price,
  category = excluded.category;
