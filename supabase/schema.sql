-- Content Automation Dashboard schema
-- This is the shared data store between the dashboard (Next.js/Supabase)
-- and the n8n workflow. n8n reads/writes these tables directly via its
-- Postgres credential instead of Google Sheets.

create extension if not exists "pgcrypto";

create type content_status as enum ('Pending', 'Ready', 'Posted', 'Rejected');

-- One row per platform the agency posts to.
create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- 'linkedin', 'twitter', 'instagram', 'facebook'
  display_name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Per-platform automation config, editable from the dashboard.
create table if not exists platform_settings (
  platform_id uuid primary key references platforms(id) on delete cascade,
  brand_voice_prompt text not null default '',
  posting_cadence_cron text not null default '0 8 * * *', -- when the n8n idea-gen trigger should fire
  publish_cadence_cron text not null default '0 9 * * *', -- when the n8n publish trigger should fire
  updated_at timestamptz not null default now()
);

-- One row per generated piece of content (replaces the Google Sheet rows).
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references platforms(id) on delete cascade,
  name text,
  industry text,
  problem text,
  automation_solution text,
  tools_stack text,
  business_result text,
  title text,
  post_text text,
  image_url text,
  headline text,
  visual_metaphor text,
  hero_object text,
  composition text,
  text_position text,
  status content_status not null default 'Pending',
  scheduled_for date,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists content_items_status_idx on content_items (status);
create index if not exists content_items_platform_idx on content_items (platform_id);
create index if not exists content_items_scheduled_idx on content_items (scheduled_for);

-- Seed the platforms the workflow currently supports (or will support).
insert into platforms (slug, display_name, enabled)
values
  ('linkedin', 'LinkedIn', true),
  ('twitter', 'X / Twitter', false),
  ('instagram', 'Instagram', false),
  ('facebook', 'Facebook', false)
on conflict (slug) do nothing;

insert into platform_settings (platform_id, brand_voice_prompt)
select id, 'You are "The Operator" — a CEO of an AI automation agency who writes LinkedIn posts personally, no ghostwriter polish.'
from platforms
where slug = 'linkedin'
on conflict (platform_id) do nothing;

-- Row Level Security: dashboard users must be authenticated to read/write.
-- n8n connects with the Postgres service-role connection string, which
-- bypasses RLS, so this only gates the dashboard's browser/session client.
alter table platforms enable row level security;
alter table platform_settings enable row level security;
alter table content_items enable row level security;

create policy "authenticated read platforms" on platforms
  for select using (auth.role() = 'authenticated');
create policy "authenticated write platforms" on platforms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read platform_settings" on platform_settings
  for select using (auth.role() = 'authenticated');
create policy "authenticated write platform_settings" on platform_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read content_items" on content_items
  for select using (auth.role() = 'authenticated');
create policy "authenticated write content_items" on content_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
