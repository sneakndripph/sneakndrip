-- page_views had no index at all, so every dashboard/visitors query that
-- filters by created_at (admin dashboard, visitors card) was a full
-- sequential scan over an unbounded, ever-growing table.
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at);
