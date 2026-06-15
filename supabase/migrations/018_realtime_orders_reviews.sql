-- Enable Supabase Realtime on orders, reviews, and return_requests
-- Required for instant admin dashboard refresh and nav badge counts
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE return_requests;
