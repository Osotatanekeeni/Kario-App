-- ============================================================
-- Trade Journal migration
-- Run once in the Supabase SQL editor after schema.sql
-- Adds session, setup_type, screenshot_urls to trades
-- ============================================================

alter table public.trades
  add column if not exists session         text,
  add column if not exists setup_type      text,
  add column if not exists screenshot_urls text[];
