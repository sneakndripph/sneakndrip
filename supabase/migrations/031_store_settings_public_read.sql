-- Allow anonymous reads on store_settings so middleware can check maintenance_mode
-- Write access remains service-role only (no INSERT/UPDATE/DELETE policy)
CREATE POLICY "public_read_store_settings"
  ON store_settings
  FOR SELECT
  USING (true);
