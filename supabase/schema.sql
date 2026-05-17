-- ============================================================
-- Kario — Supabase PostgreSQL Schema
-- Trading Psychology & Behavioral Performance App
-- ============================================================
-- Run this against your Supabase project via the SQL editor
-- or `supabase db push` if using the CLI.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";     -- fuzzy symbol search


-- ============================================================
-- ENUMS
-- ============================================================

create type emotion_label as enum (
  'calm', 'focused', 'confident', 'patient',
  'anxious', 'fearful', 'greedy', 'frustrated',
  'euphoric', 'impulsive', 'detached', 'overwhelmed'
);

create type trade_direction as enum ('long', 'short');

create type trade_status as enum ('open', 'closed');

create type trade_outcome as enum ('win', 'loss', 'breakeven');

create type trading_style as enum (
  'scalper', 'day-trader', 'swing-trader', 'position-trader'
);

create type experience_level as enum (
  'beginner', 'intermediate', 'advanced', 'professional'
);

create type rule_category as enum (
  'entry', 'exit', 'risk', 'psychology', 'process'
);

create type emotion_phase as enum ('pre', 'post');

create type mistake_type as enum (
  'early_entry',
  'early_exit',
  'late_entry',
  'late_exit',
  'oversize',
  'undersize',
  'moved_stop',
  'missed_signal',
  'revenge_trade',
  'fomo',
  'overtrading',
  'broke_rule',
  'no_plan',
  'poor_risk_reward',
  'ignored_bias',
  'other'
);

create type mistake_impact as enum ('minor', 'moderate', 'major');

create type reflection_type as enum (
  'pre_session',
  'post_session',
  'trade_review',
  'weekly',
  'monthly'
);

create type score_period as enum ('day', 'week', 'month');


-- ============================================================
-- TABLE: users
-- Extends auth.users — one row per Supabase auth identity.
-- Auto-created via trigger on auth.users insert.
-- ============================================================

create table public.users (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  display_name          text,
  trading_style         trading_style,
  experience_level      experience_level,
  default_currency      text        not null default 'USD',
  timezone              text        not null default 'UTC',
  onboarding_completed  boolean     not null default false,
  reminder_enabled      boolean     not null default false,
  reminder_time         time,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.users is
  'App-level user profile, 1-to-1 with auth.users.';


-- ============================================================
-- TABLE: user_rules
-- The trader''s personal playbook — rules they commit to follow.
-- ============================================================

create table public.user_rules (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  title       text        not null,
  description text,
  category    rule_category not null,
  is_active   boolean     not null default true,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.user_rules is
  'Trader playbook rules. Referenced by trade_rules junction for adherence tracking.';


-- ============================================================
-- TABLE: trades
-- Core journal entry. Captures the full trade lifecycle.
-- ============================================================

create table public.trades (
  id                uuid          primary key default uuid_generate_v4(),
  user_id           uuid          not null references public.users(id) on delete cascade,

  -- Instrument
  symbol            text          not null,
  direction         trade_direction not null,

  -- Lifecycle
  status            trade_status  not null default 'open',
  outcome           trade_outcome,
  closed_at         timestamptz,

  -- Pricing (optional — psychological tracking works without these)
  entry_price       numeric(18,8),
  exit_price        numeric(18,8),
  position_size     numeric(18,8),
  risk_reward_ratio numeric(8,4),
  pnl               numeric(18,8),
  currency          text          not null default 'USD',

  -- Quality self-assessment (1–10)
  setup_quality     smallint      check (setup_quality between 1 and 10),
  execution_quality smallint      check (execution_quality between 1 and 10),

  -- Computed discipline score (0–100), stored for analytics
  discipline_score  smallint      check (discipline_score between 0 and 100),

  -- Notes
  notes             text          not null default '',
  lessons_learned   text,
  tags              text[]        not null default '{}',

  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),

  -- Integrity: outcome and exit data only valid on closed trades
  constraint trades_outcome_requires_closed
    check (outcome is null or status = 'closed'),
  constraint trades_exit_requires_closed
    check (exit_price is null or status = 'closed'),
  constraint trades_closed_at_requires_closed
    check (closed_at is null or status = 'closed')
);

comment on table public.trades is
  'Core trade journal entries. Each row = one trade, open or closed.';
comment on column public.trades.discipline_score is
  'Composite 0–100 score: rule adherence (50%), setup quality (25%), execution quality (25%).';


-- ============================================================
-- TABLE: trade_emotions
-- Pre and post-trade emotional snapshots.
-- One row per phase per trade (unique constraint enforced).
-- ============================================================

create table public.trade_emotions (
  id          uuid        primary key default uuid_generate_v4(),
  trade_id    uuid        not null references public.trades(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,
  phase       emotion_phase not null,
  label       emotion_label not null,
  intensity   smallint    not null check (intensity between 1 and 10),
  notes       text,
  recorded_at timestamptz not null default now(),

  constraint trade_emotions_unique_phase unique (trade_id, phase)
);

comment on table public.trade_emotions is
  'Pre/post-trade emotional state. One snapshot per phase per trade.';


-- ============================================================
-- TABLE: trade_mistakes
-- Specific mistakes tagged to a trade for pattern tracking.
-- Multiple mistakes allowed per trade.
-- ============================================================

create table public.trade_mistakes (
  id          uuid          primary key default uuid_generate_v4(),
  trade_id    uuid          not null references public.trades(id) on delete cascade,
  user_id     uuid          not null references public.users(id) on delete cascade,
  type        mistake_type  not null,
  description text,
  impact      mistake_impact not null default 'moderate',
  created_at  timestamptz   not null default now()
);

comment on table public.trade_mistakes is
  'Behavioural mistakes per trade. Used to surface recurring patterns.';


-- ============================================================
-- TABLE: trade_rules
-- Junction: which of the user''s rules were followed or broken
-- on a specific trade.
-- ============================================================

create table public.trade_rules (
  id          uuid        primary key default uuid_generate_v4(),
  trade_id    uuid        not null references public.trades(id) on delete cascade,
  rule_id     uuid        not null references public.user_rules(id) on delete cascade,
  user_id     uuid        not null references public.users(id) on delete cascade,
  followed    boolean     not null,
  created_at  timestamptz not null default now(),

  constraint trade_rules_unique unique (trade_id, rule_id)
);

comment on table public.trade_rules is
  'Rule adherence per trade. Powers discipline score and playbook analytics.';


-- ============================================================
-- TABLE: reflections
-- AI coaching sessions. Stores the full conversation as JSONB
-- plus AI-generated summary and extracted insights.
-- messages format: [{ id, role: "user"|"assistant", content, timestamp }]
-- ============================================================

create table public.reflections (
  id          uuid            primary key default uuid_generate_v4(),
  user_id     uuid            not null references public.users(id) on delete cascade,
  trade_id    uuid            references public.trades(id) on delete set null,
  type        reflection_type not null default 'trade_review',
  mood        emotion_label   not null,
  messages    jsonb           not null default '[]'::jsonb,
  summary     text,
  insights    text[]          not null default '{}',
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);

comment on table public.reflections is
  'AI coaching sessions. trade_id is nullable for general (non-trade-specific) reflections.';
comment on column public.reflections.messages is
  'Chat history: [{id, role:"user"|"assistant", content, timestamp}]';


-- ============================================================
-- TABLE: discipline_scores
-- Computed analytics snapshots per period.
-- Populated by Supabase Edge Function or app-side computation.
-- Unique per (user, period, period_start) — upsert safe.
-- ============================================================

create table public.discipline_scores (
  id                    uuid        primary key default uuid_generate_v4(),
  user_id               uuid        not null references public.users(id) on delete cascade,
  period                score_period not null,
  period_start          date        not null,
  period_end            date        not null,

  -- Composite score
  overall_score         smallint    not null check (overall_score between 0 and 100),

  -- Sub-metrics
  rules_followed_rate   numeric(5,4) not null check (rules_followed_rate between 0 and 1),
  emotional_consistency smallint    not null check (emotional_consistency between 0 and 100),
  entry_quality         smallint    not null check (entry_quality between 0 and 100),
  exit_quality          smallint    not null check (exit_quality between 0 and 100),

  -- Counts
  total_trades          int         not null default 0,
  win_count             int         not null default 0,
  loss_count            int         not null default 0,
  breakeven_count       int         not null default 0,

  computed_at           timestamptz not null default now(),

  constraint discipline_scores_unique_period
    unique (user_id, period, period_start),
  constraint discipline_scores_period_order
    check (period_end >= period_start)
);

comment on table public.discipline_scores is
  'Snapshot analytics per day/week/month. Upsert-safe via unique(user_id, period, period_start).';


-- ============================================================
-- TABLE: weekly_reports
-- AI-generated weekly summary + recommendations.
-- One per user per week_start (ISO Monday).
-- ============================================================

create table public.weekly_reports (
  id                       uuid          primary key default uuid_generate_v4(),
  user_id                  uuid          not null references public.users(id) on delete cascade,
  week_start               date          not null,
  week_end                 date          not null,

  -- Trade counts
  trade_count              int           not null default 0,
  win_count                int           not null default 0,
  loss_count               int           not null default 0,
  breakeven_count          int           not null default 0,

  -- Aggregate score
  overall_discipline_score smallint      check (overall_discipline_score between 0 and 100),

  -- Behavioral patterns
  dominant_emotion         emotion_label,
  most_broken_rule_id      uuid          references public.user_rules(id) on delete set null,

  -- AI-generated content
  key_insight              text,
  summary                  text,
  recommendations          text[]        not null default '{}',

  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now(),

  constraint weekly_reports_unique_week unique (user_id, week_start),
  constraint weekly_reports_week_order  check (week_end >= week_start)
);

comment on table public.weekly_reports is
  'AI-generated weekly performance report. One per user per ISO week.';


-- ============================================================
-- INDEXES
-- ============================================================

-- trades — primary access patterns
create index idx_trades_user_created    on public.trades(user_id, created_at desc);
create index idx_trades_user_status     on public.trades(user_id, status);
create index idx_trades_user_outcome    on public.trades(user_id, outcome)
  where outcome is not null;
create index idx_trades_user_closed     on public.trades(user_id, closed_at desc)
  where closed_at is not null;
create index idx_trades_symbol_trgm     on public.trades using gin(symbol gin_trgm_ops);
create index idx_trades_tags            on public.trades using gin(tags);

-- trade_emotions — emotion analytics
create index idx_trade_emotions_trade   on public.trade_emotions(trade_id);
create index idx_trade_emotions_user_label on public.trade_emotions(user_id, label);
create index idx_trade_emotions_user_phase on public.trade_emotions(user_id, phase);

-- trade_mistakes — pattern detection
create index idx_trade_mistakes_trade   on public.trade_mistakes(trade_id);
create index idx_trade_mistakes_user_type on public.trade_mistakes(user_id, type);
create index idx_trade_mistakes_impact  on public.trade_mistakes(user_id, impact);

-- trade_rules — adherence analytics
create index idx_trade_rules_trade      on public.trade_rules(trade_id);
create index idx_trade_rules_rule       on public.trade_rules(rule_id);
create index idx_trade_rules_user_followed on public.trade_rules(user_id, followed);

-- reflections
create index idx_reflections_user_created on public.reflections(user_id, created_at desc);
create index idx_reflections_trade      on public.reflections(trade_id)
  where trade_id is not null;
create index idx_reflections_type       on public.reflections(user_id, type);

-- discipline_scores
create index idx_discipline_scores_user_period on
  public.discipline_scores(user_id, period, period_start desc);

-- user_rules
create index idx_user_rules_user_active on public.user_rules(user_id, is_active);
create index idx_user_rules_category   on public.user_rules(user_id, category);

-- weekly_reports
create index idx_weekly_reports_user_week on public.weekly_reports(user_id, week_start desc);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users             enable row level security;
alter table public.user_rules        enable row level security;
alter table public.trades            enable row level security;
alter table public.trade_emotions    enable row level security;
alter table public.trade_mistakes    enable row level security;
alter table public.trade_rules       enable row level security;
alter table public.reflections       enable row level security;
alter table public.discipline_scores enable row level security;
alter table public.weekly_reports    enable row level security;

-- users: own row only
create policy "users: own row"
  on public.users for all
  using  (id = auth.uid())
  with check (id = auth.uid());

-- user_rules: own rules only
create policy "user_rules: owner"
  on public.user_rules for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- trades: own trades only
create policy "trades: owner"
  on public.trades for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- trade_emotions: own data only
create policy "trade_emotions: owner"
  on public.trade_emotions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- trade_mistakes: own data only
create policy "trade_mistakes: owner"
  on public.trade_mistakes for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- trade_rules: own data only
create policy "trade_rules: owner"
  on public.trade_rules for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- reflections: own data only
create policy "reflections: owner"
  on public.reflections for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- discipline_scores: own data only
create policy "discipline_scores: owner"
  on public.discipline_scores for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- weekly_reports: own data only
create policy "weekly_reports: owner"
  on public.weekly_reports for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Automatic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_trades_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

create trigger trg_user_rules_updated_at
  before update on public.user_rules
  for each row execute function public.set_updated_at();

create trigger trg_reflections_updated_at
  before update on public.reflections
  for each row execute function public.set_updated_at();

create trigger trg_weekly_reports_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();

-- Auto-stamp closed_at when a trade transitions to 'closed'
create or replace function public.handle_trade_close()
returns trigger language plpgsql as $$
begin
  if new.status = 'closed' and old.status = 'open' then
    new.closed_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_trade_close
  before update on public.trades
  for each row execute function public.handle_trade_close();

-- Auto-create user profile row on Supabase auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- ANALYTICS VIEW: trade_analytics
-- Flat denormalized view for insight queries.
-- Joins pre/post emotions and rule adherence counts per trade.
-- Inherits RLS from underlying tables (security_invoker).
-- ============================================================

create or replace view public.trade_analytics
  with (security_invoker = true)
as
select
  t.id,
  t.user_id,
  t.symbol,
  t.direction,
  t.status,
  t.outcome,
  t.discipline_score,
  t.setup_quality,
  t.execution_quality,
  t.pnl,
  t.risk_reward_ratio,
  t.currency,
  t.tags,
  t.created_at,
  t.closed_at,

  -- Pre-trade emotion
  te_pre.label       as emotion_before,
  te_pre.intensity   as emotion_before_intensity,

  -- Post-trade emotion
  te_post.label      as emotion_after,
  te_post.intensity  as emotion_after_intensity,

  -- Rule adherence counts (subqueries — efficient with idx_trade_rules_trade)
  (
    select count(*) from public.trade_rules tr
    where tr.trade_id = t.id and tr.followed = true
  )::int as rules_followed_count,
  (
    select count(*) from public.trade_rules tr
    where tr.trade_id = t.id and tr.followed = false
  )::int as rules_broken_count,

  -- Mistake count
  (
    select count(*) from public.trade_mistakes tm
    where tm.trade_id = t.id
  )::int as mistake_count

from public.trades t
left join public.trade_emotions te_pre
  on te_pre.trade_id = t.id and te_pre.phase = 'pre'
left join public.trade_emotions te_post
  on te_post.trade_id = t.id and te_post.phase = 'post';

comment on view public.trade_analytics is
  'Denormalized trade view for analytics. security_invoker ensures RLS is enforced.';
