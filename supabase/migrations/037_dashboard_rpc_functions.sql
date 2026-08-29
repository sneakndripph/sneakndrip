-- Server-side aggregation for the admin dashboard, replacing two patterns
-- that fetched every matching row and reduced them in JS:
--   1. Unique visitor counts (COUNT(DISTINCT session_id) instead of
--      shipping every page_views row just to build a Set in JS).
--   2. Top products by revenue (SUM/GROUP BY scoped to a period, instead
--      of pulling the entire order_items table unfiltered on every load).
-- Both are called only from the admin dashboard via the service-role
-- client, so execution is restricted to service_role.

CREATE OR REPLACE FUNCTION public.count_unique_page_view_sessions(range_start timestamptz, range_end timestamptz)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT session_id)::int
  FROM public.page_views
  WHERE created_at >= range_start AND created_at < range_end;
$$;

REVOKE ALL ON FUNCTION public.count_unique_page_view_sessions(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unique_page_view_sessions(timestamptz, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.top_products_by_period(period_start timestamptz, result_limit integer DEFAULT 5)
RETURNS TABLE(product_name text, revenue numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT oi.product_name, SUM(oi.unit_price * oi.quantity) AS revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.created_at >= period_start
  GROUP BY oi.product_name
  ORDER BY revenue DESC
  LIMIT result_limit;
$$;

REVOKE ALL ON FUNCTION public.top_products_by_period(timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.top_products_by_period(timestamptz, integer) TO service_role;
