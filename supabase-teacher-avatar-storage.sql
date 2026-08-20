-- Run in Supabase Dashboard -> SQL Editor.
-- Create the public bucket used for teacher profile photos.
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-avatars', 'teacher-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

GRANT SELECT, INSERT, UPDATE ON TABLE storage.objects TO anon, authenticated;

DROP POLICY IF EXISTS teacher_avatar_public_read ON storage.objects;
CREATE POLICY teacher_avatar_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'teacher-avatars');

DROP POLICY IF EXISTS teacher_avatar_authenticated_insert ON storage.objects;
CREATE POLICY teacher_avatar_authenticated_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'teacher-avatars');

DROP POLICY IF EXISTS teacher_avatar_authenticated_update ON storage.objects;
CREATE POLICY teacher_avatar_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'teacher-avatars') WITH CHECK (bucket_id = 'teacher-avatars');
