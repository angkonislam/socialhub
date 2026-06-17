-- ============================================================================
-- Social Hub — Supabase schema
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Includes tables, indexes, and Row Level Security policies.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type platform as enum
    ('facebook', 'instagram', 'youtube', 'tiktok', 'telegram', 'linkedin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum
    ('facebook_page', 'instagram_business', 'youtube_channel',
     'tiktok_account', 'telegram_channel', 'linkedin_profile');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum
    ('draft', 'scheduled', 'publishing', 'published', 'failed');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- users
-- Mirror of the Auth.js user. `id` matches the auth user id.
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text,
  email       text unique,
  image       text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- connected_accounts
-- A social account/page/channel a user has connected.
-- ----------------------------------------------------------------------------
create table if not exists public.connected_accounts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  platform      platform not null,
  account_type  account_type not null,
  external_id   text not null,
  display_name  text not null,
  avatar_url    text,
  access_token  text,            -- store encrypted in production
  refresh_token text,
  connected_at  timestamptz not null default now(),
  unique (user_id, platform, external_id)
);
create index if not exists idx_accounts_user on public.connected_accounts(user_id);

-- ----------------------------------------------------------------------------
-- posts
-- Canonical post. `status` covers draft/scheduled/published/failed, so the
-- "scheduled_posts" and "drafts" views below are projections of this table.
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  content       text not null,
  media_urls    text[] not null default '{}',
  hashtags      text[] not null default '{}',
  status        post_status not null default 'draft',
  scheduled_at  timestamptz,
  published_at  timestamptz,
  targets       jsonb not null default '[]',  -- [{ platform, account_id }]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_posts_user on public.posts(user_id);
create index if not exists idx_posts_status on public.posts(status);

-- Convenience views requested by the spec -----------------------------------
create or replace view public.scheduled_posts as
  select * from public.posts where status = 'scheduled';

create or replace view public.drafts as
  select * from public.posts where status = 'draft';

-- ----------------------------------------------------------------------------
-- activity_logs
-- Append-only audit/activity feed shown on the dashboard.
-- ----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  action      text not null,
  detail      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activity_user on public.activity_logs(user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger for posts
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- Each user can only read/write their own rows. The server uses the
-- service-role key (which bypasses RLS) for trusted operations.
-- ============================================================================
alter table public.users             enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.posts             enable row level security;
alter table public.activity_logs     enable row level security;

create policy "Users read self"
  on public.users for select using (auth.uid() = id);

create policy "Accounts owner access"
  on public.connected_accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Posts owner access"
  on public.posts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Activity owner read"
  on public.activity_logs for select using (auth.uid() = user_id);
