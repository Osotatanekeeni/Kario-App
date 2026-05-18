-- Weekly psychology reports
-- Run this in Supabase SQL editor

create table if not exists public.weekly_reports (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  week_start      date        not null,
  week_end        date        not null,
  score           integer     not null,
  previous_score  integer,
  delta           integer,
  trade_count     integer     not null default 0,
  report_data     jsonb       not null default '{}'::jsonb,
  ai_sections     jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  constraint weekly_reports_user_week_unique unique (user_id, week_start)
);

alter table public.weekly_reports enable row level security;

create policy "weekly_reports_user_policy"
  on public.weekly_reports
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
