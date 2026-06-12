-- Activity log for tracking admin actions
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  entity_name  TEXT,
  actor_email  TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity  ON activity_log(entity_type, entity_id);

-- Only admins can read/write activity log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity log"
  ON activity_log FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users
    WHERE raw_user_meta_data ->> 'role' = 'admin'
  ));
