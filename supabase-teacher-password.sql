-- Run in Supabase Dashboard -> SQL Editor.
-- Add per-teacher passwords used by the administrator settings screen.
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS password VARCHAR(255);

UPDATE public.teachers
SET password = '123'
WHERE password IS NULL OR password = '';