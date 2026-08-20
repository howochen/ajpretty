-- Run in Supabase Dashboard -> SQL Editor.
-- Stores customizable labels and copy for the public website.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS site_content JSONB NOT NULL DEFAULT '{}'::jsonb;