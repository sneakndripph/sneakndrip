-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS store_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Allow service role full access (anon/auth have no access)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- No public policies — all access via service role API routes only
