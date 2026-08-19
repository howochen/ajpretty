-- Run in Supabase Dashboard → SQL Editor, then click Run.
-- Project: https://supabase.com/dashboard/project/gitcjksnelwxdwjgoeeo/sql/new
--
-- This replaces tenant GUC policies and grants anon/authenticated access
-- so the public booking form can insert rows.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.tenants,
  public.services,
  public.teachers,
  public.bookings,
  public.availability
TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('tenants', 'services', 'teachers', 'bookings', 'availability')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_public_read ON public.tenants
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY tenants_public_update ON public.tenants
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY services_public_all ON public.services
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY teachers_public_all ON public.teachers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY bookings_public_all ON public.bookings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY availability_public_all ON public.availability
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
