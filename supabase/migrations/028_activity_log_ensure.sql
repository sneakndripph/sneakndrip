-- Ensure activity_log table and policies exist (safe to run even if 012 was applied)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  entity_name  TEXT,
  actor_email  TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity  ON public.activity_log(entity_type, entity_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists, then recreate
DROP POLICY IF EXISTS "Admins can manage activity log" ON public.activity_log;

-- Service role bypasses RLS; this policy allows admin users via their JWT
CREATE POLICY "Admins can manage activity log"
  ON public.activity_log FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
