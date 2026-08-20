-- Run in Supabase Dashboard -> SQL Editor.
-- Ensure the frontend can really delete teacher rows for the current project.
GRANT DELETE ON TABLE public.teachers TO anon, authenticated;

DROP POLICY IF EXISTS teachers_delete_public ON public.teachers;
CREATE POLICY teachers_delete_public ON public.teachers
  FOR DELETE TO anon, authenticated
  USING (true);