-- Enable Supabase Realtime on chat tables
-- Required for live message delivery in the chat widget and admin inbox
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
