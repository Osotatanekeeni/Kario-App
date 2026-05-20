-- ============================================================
-- Playbook migration
-- Run in Supabase SQL editor after schema.sql
-- Adds trade_setups and behavioral_principles tables
-- ============================================================

-- Setup library: named setups with entry criteria, invalidation,
-- confirmation requirements, and notes.
create table if not exists public.trade_setups (
  id                        uuid        primary key default gen_random_uuid(),
  user_id                   uuid        not null references auth.users(id) on delete cascade,
  name                      text        not null,
  screenshot_url            text,
  entry_criteria            text,
  invalidation_rules        text,
  confirmation_requirements text,
  notes                     text,
  sort_order                int         not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.trade_setups enable row level security;

create policy "trade_setups_owner"
  on public.trade_setups for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Behavioral principles: mindset anchors shown as daily reminders.
create table if not exists public.behavioral_principles (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  text       text        not null,
  sort_order int         not null default 0,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.behavioral_principles enable row level security;

create policy "behavioral_principles_owner"
  on public.behavioral_principles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
