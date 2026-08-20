-- Run this migration for an existing Supabase project.
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS experience TEXT;

CREATE TABLE IF NOT EXISTS public.teacher_schedule_dates (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tenant_id, teacher_id, date)
);

ALTER TABLE public.availability ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Existing availability rows cannot be safely assigned to a teacher automatically.
-- Remove them before using teacher-specific schedules; they will be recreated when saved.
DELETE FROM public.availability WHERE teacher_id IS NULL;

ALTER TABLE public.availability ALTER COLUMN teacher_id SET NOT NULL;
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS availability_tenant_id_date_time_key;
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS availability_tenant_teacher_date_time_key;
ALTER TABLE public.availability ADD CONSTRAINT availability_tenant_teacher_date_time_key
  UNIQUE (tenant_id, teacher_id, date, time);

CREATE INDEX IF NOT EXISTS idx_availability_teacher_date ON public.availability(teacher_id, date);

GRANT SELECT, INSERT, DELETE ON TABLE public.teacher_schedule_dates TO anon, authenticated;

ALTER TABLE public.teacher_schedule_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_schedule_dates_public ON public.teacher_schedule_dates;
CREATE POLICY teacher_schedule_dates_public ON public.teacher_schedule_dates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Remove legacy rows that were created for dates with no available slots.
-- A date remains configured only when at least one slot is available.
DELETE FROM public.availability AS current_slot
WHERE current_slot.is_available = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.availability AS available_slot
    WHERE available_slot.tenant_id = current_slot.tenant_id
      AND available_slot.teacher_id = current_slot.teacher_id
      AND available_slot.date = current_slot.date
      AND available_slot.is_available = true
  );

GRANT SELECT, INSERT, UPDATE ON TABLE public.availability TO anon, authenticated;

DROP POLICY IF EXISTS availability_teacher_schedule ON public.availability;
CREATE POLICY availability_teacher_schedule ON public.availability
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);