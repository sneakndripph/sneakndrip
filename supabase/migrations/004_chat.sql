-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT,
  customer_name  TEXT NOT NULL DEFAULT 'Guest',
  status         TEXT NOT NULL DEFAULT 'open',
  last_message   TEXT,
  unread_admin   INT  NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('customer','admin')),
  sender_name     TEXT,
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone can create/read conversations (guests use session token approach)
CREATE POLICY "public_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_messages"      ON messages      FOR ALL USING (true) WITH CHECK (true);

-- Index for fast message lookup
CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, created_at);
