-- Shopify AI sales agent — store mirror schema
--
-- Apply by pasting into the Supabase SQL editor (same workflow as the root
-- project's supabase/schema.sql). Safe to re-run.
--
-- EMBEDDING DIMENSION: vector(1024) below matches Voyage (voyage-3) and Cohere
-- multilingual embeddings. If you switch to OpenAI text-embedding-3-small,
-- change every vector(1024) to vector(1536) BEFORE inserting any rows —
-- pgvector cannot change a column's dimension once data exists.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------

create table if not exists shops (
  id                   uuid primary key default gen_random_uuid(),
  shop_domain          text not null unique,          -- e.g. my-store.myshopify.com
  access_token         text not null,                 -- encrypt at the app layer before insert
  scopes               text,
  shop_name            text,
  currency             text not null default 'PKR',
  country_code         text,
  primary_locale       text,
  installed_at         timestamptz not null default now(),
  uninstalled_at       timestamptz,
  last_full_sync_at    timestamptz,
  last_delta_sync_at   timestamptz,
  sync_state           text not null default 'pending'
                       check (sync_state in ('pending','running','ready','error')),
  sync_error           text
);

-- ---------------------------------------------------------------------------
-- Catalog mirror
-- ---------------------------------------------------------------------------

create table if not exists products (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  shopify_gid          text not null,
  handle               text not null,
  title                text not null,
  description          text,                          -- HTML stripped to plain text
  product_type         text,
  vendor               text,
  tags                 text[] not null default '{}',
  status               text not null default 'ACTIVE',
  images               jsonb not null default '[]'::jsonb,
  online_store_url     text,
  price_min            numeric(12,2),
  price_max            numeric(12,2),
  available            boolean not null default false,
  -- Shopify's own updated_at. Used to drop stale/out-of-order webhook payloads.
  shopify_updated_at   timestamptz,
  -- Hash of the embeddable text. Lets inventory-only changes skip re-embedding.
  content_hash         text,
  synced_at            timestamptz not null default now(),
  unique (shop_id, shopify_gid)
);

create index if not exists products_shop_idx        on products (shop_id);
create index if not exists products_shop_avail_idx  on products (shop_id, available);
create index if not exists products_title_trgm_idx  on products using gin (title gin_trgm_ops);
create index if not exists products_tags_idx        on products using gin (tags);

create table if not exists variants (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  product_id           uuid not null references products(id) on delete cascade,
  shopify_gid          text not null,
  -- Numeric variant id, needed for /cart/{id}:{qty} permalinks.
  shopify_variant_id   text not null,
  title                text,
  sku                  text,
  options              jsonb not null default '{}'::jsonb,   -- {"Size":"M","Color":"Black"}
  price                numeric(12,2),
  compare_at_price     numeric(12,2),
  inventory_quantity   integer,
  available            boolean not null default false,
  position             integer,
  shopify_updated_at   timestamptz,
  -- Stamped on every sync. Rows left behind with an older stamp were deleted
  -- in Shopify, which is how the reconcile pass finds them.
  synced_at            timestamptz not null default now(),
  unique (shop_id, shopify_gid)
);

create index if not exists variants_product_idx on variants (product_id);

create table if not exists collections (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  shopify_gid          text not null,
  handle               text not null,
  title                text not null,
  description          text,
  shopify_updated_at   timestamptz,
  synced_at            timestamptz not null default now(),
  unique (shop_id, shopify_gid)
);

create table if not exists product_collections (
  product_id           uuid not null references products(id) on delete cascade,
  collection_id        uuid not null references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

-- Policies, FAQ pages, shipping/returns/COD text. One row per document.
create table if not exists store_docs (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  kind                 text not null,                 -- refund_policy | shipping_policy | privacy_policy | terms | page | faq
  slug                 text not null,
  title                text,
  body                 text not null,
  content_hash         text,
  shopify_updated_at   timestamptz,
  synced_at            timestamptz not null default now(),
  unique (shop_id, kind, slug)
);

-- ---------------------------------------------------------------------------
-- Embeddings — one table for every embeddable owner type
-- ---------------------------------------------------------------------------

create table if not exists embeddings (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  owner_type           text not null check (owner_type in ('product','store_doc','collection')),
  owner_id             uuid not null,
  content              text not null,                 -- exact text that was embedded
  content_hash         text not null,
  embedding            vector(1024) not null,
  model                text not null,
  created_at           timestamptz not null default now(),
  unique (shop_id, owner_type, owner_id)
);

-- IVFFlat needs rows before it is worth building; harmless on an empty table.
create index if not exists embeddings_vec_idx
  on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists embeddings_owner_idx on embeddings (shop_id, owner_type);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

create table if not exists conversations (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  visitor_id           text not null,                 -- anonymous id from the widget
  locale               text,
  started_at           timestamptz not null default now(),
  last_message_at      timestamptz not null default now(),
  escalated            boolean not null default false,
  escalation_reason    text,
  -- Set when the bot hands back a cart link, so you can attribute revenue later.
  cart_link_sent       boolean not null default false
);

create index if not exists conversations_shop_idx on conversations (shop_id, last_message_at desc);

create table if not exists messages (
  id                   uuid primary key default gen_random_uuid(),
  conversation_id      uuid not null references conversations(id) on delete cascade,
  shop_id              uuid not null references shops(id) on delete cascade,
  role                 text not null check (role in ('user','assistant','tool','system')),
  content              text,
  tool_calls           jsonb,
  -- Per-message cost accounting. You cannot price this product without it.
  model                text,
  input_tokens         integer,
  output_tokens        integer,
  cache_read_tokens    integer,
  cost_usd             numeric(10,6),
  latency_ms           integer,
  created_at           timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Per-shop bot configuration
-- ---------------------------------------------------------------------------

create table if not exists bot_settings (
  shop_id              uuid primary key references shops(id) on delete cascade,
  enabled              boolean not null default true,
  bot_name             text not null default 'Sales Assistant',
  brand_voice          text,                          -- merchant's own notes on tone
  register             text not null default 'neutral'
                       check (register in ('formal','neutral','casual')),
  -- casual permits bhai/baji; formal never uses them. Luxury brands want formal.
  languages            text[] not null default '{english,roman_urdu,urdu}',
  greeting             text,
  max_discount_percent numeric(5,2) not null default 0,
  discount_code        text,
  cod_available        boolean not null default true,
  delivery_days_min    integer,
  delivery_days_max    integer,
  escalation_contact   text,                          -- whatsapp number or email
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Hybrid product search
-- ---------------------------------------------------------------------------
-- Combines vector similarity with a trigram keyword score, then applies hard
-- filters. Pure vector search embarrasses itself on exact SKU/brand lookups;
-- pure keyword search fails on "something warm for winter". You need both.

create or replace function match_products(
  p_shop_id          uuid,
  p_query_embedding  vector(1024),
  p_query_text       text default '',
  p_min_price        numeric default null,
  p_max_price        numeric default null,
  p_in_stock_only    boolean default true,
  p_limit            integer default 8
)
returns table (
  product_id     uuid,
  handle         text,
  title          text,
  description    text,
  product_type   text,
  tags           text[],
  price_min      numeric,
  price_max      numeric,
  available      boolean,
  score          double precision
)
language sql
stable
as $$
  select
    p.id,
    p.handle,
    p.title,
    p.description,
    p.product_type,
    p.tags,
    p.price_min,
    p.price_max,
    p.available,
    -- 70% semantic, 30% lexical. Tune on your eval set, not by intuition.
    (0.7 * (1 - (e.embedding <=> p_query_embedding))
     + 0.3 * coalesce(similarity(p.title, p_query_text), 0))::double precision as score
  from products p
  join embeddings e
    on e.owner_id = p.id
   and e.owner_type = 'product'
  where p.shop_id = p_shop_id
    and p.status = 'ACTIVE'
    and (not p_in_stock_only or p.available)
    and (p_min_price is null or p.price_max >= p_min_price)
    and (p_max_price is null or p.price_min <= p_max_price)
  order by score desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- This is the multi-tenant boundary. Every table carries shop_id and denies by
-- default: the app connects with the service role for sync and chat, and must
-- scope every query by shop_id itself. These policies exist so that an anon or
-- authenticated key (e.g. a future merchant-facing client) can never read
-- another store's catalog or conversations.

alter table shops               enable row level security;
alter table products            enable row level security;
alter table variants            enable row level security;
alter table collections         enable row level security;
alter table product_collections enable row level security;
alter table store_docs          enable row level security;
alter table embeddings          enable row level security;
alter table conversations       enable row level security;
alter table messages            enable row level security;
alter table bot_settings        enable row level security;

-- No permissive policies are created here on purpose. With RLS enabled and no
-- policy, anon and authenticated roles get nothing; the service role bypasses
-- RLS entirely. When you add a merchant-facing client that authenticates as a
-- Supabase user, add policies keyed on that user's shop_id — do not widen these
-- to `using (true)`.
