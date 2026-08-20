-- Run in Supabase Dashboard -> SQL Editor.
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;