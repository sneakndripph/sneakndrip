-- Security Advisor fixes
-- 1. user_metadata / jwt role → app_metadata on all admin RLS policies
-- 2. Fix handle_new_user: add search_path + restrict execute permissions
-- 3. Tighten always-true UPDATE/DELETE policies on service-only tables
-- 4. Restrict review-photos bucket listing

-- ─────────────────────────────────────────────────────────────
-- 1a. PRODUCTS & PRODUCT_SIZES: use app_metadata for admin check
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage products"       ON public.products;
DROP POLICY IF EXISTS "Admins can manage product_sizes"  ON public.product_sizes;
DROP POLICY IF EXISTS "Admins can manage product_images" ON public.product_images;

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage product_sizes"
  ON public.product_sizes FOR ALL
  USING      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage product_images"
  ON public.product_images FOR ALL
  USING      ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fix orders admin policy
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fix order_items admin access
DROP POLICY IF EXISTS "Order items follow order access" ON public.order_items;
CREATE POLICY "Order items follow order access"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.customer_email = auth.jwt() ->> 'email'
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 1b. STORAGE: product-images admin policies (user_metadata → app_metadata)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- 1c. ACTIVITY LOG: user_metadata → app_metadata
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage activity log" ON public.activity_log;
CREATE POLICY "Admins can manage activity log"
  ON public.activity_log FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 2. HANDLE_NEW_USER: fix search_path + restrict execute
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- ─────────────────────────────────────────────────────────────
-- 3. TIGHTEN always-true UPDATE/DELETE on service-only tables
-- ─────────────────────────────────────────────────────────────

-- conversations & messages
DROP POLICY IF EXISTS "public_conversations" ON public.conversations;
DROP POLICY IF EXISTS "public_messages"      ON public.messages;

CREATE POLICY "Anyone can read conversations"  ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "No direct update conversations" ON public.conversations FOR UPDATE USING (false);
CREATE POLICY "No direct delete conversations" ON public.conversations FOR DELETE USING (false);

CREATE POLICY "Anyone can read messages"   ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "No direct update messages"  ON public.messages FOR UPDATE USING (false);
CREATE POLICY "No direct delete messages"  ON public.messages FOR DELETE USING (false);

-- coupons: keep public read, block direct writes
DROP POLICY IF EXISTS "Service writes coupons" ON public.coupons;
CREATE POLICY "No direct insert coupons" ON public.coupons FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update coupons" ON public.coupons FOR UPDATE USING (false);
CREATE POLICY "No direct delete coupons" ON public.coupons FOR DELETE USING (false);

-- inventory_log: append-only, no updates/deletes
DROP POLICY IF EXISTS "Service inserts inventory_log" ON public.inventory_log;
CREATE POLICY "No direct insert inventory_log" ON public.inventory_log FOR INSERT WITH CHECK (false);
CREATE POLICY "No update inventory_log"        ON public.inventory_log FOR UPDATE USING (false);
CREATE POLICY "No delete inventory_log"        ON public.inventory_log FOR DELETE USING (false);

-- restock_notifications
CREATE POLICY "No update restock_notify" ON public.restock_notifications FOR UPDATE USING (false);
CREATE POLICY "No delete restock_notify" ON public.restock_notifications FOR DELETE USING (false);

-- newsletter_subscribers
DROP POLICY IF EXISTS "Anyone inserts subscriber" ON public.newsletter_subscribers;
CREATE POLICY "Anyone inserts subscriber" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "No update subscriber"      ON public.newsletter_subscribers FOR UPDATE USING (false);
CREATE POLICY "No delete subscriber"      ON public.newsletter_subscribers FOR DELETE USING (false);

-- page_views: insert-only analytics
CREATE POLICY "No update page_views" ON public.page_views FOR UPDATE USING (false);
CREATE POLICY "No delete page_views" ON public.page_views FOR DELETE USING (false);

-- ─────────────────────────────────────────────────────────────
-- 4. REVIEW-PHOTOS: individual file read stays public, disable broad listing
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view review photos"  ON storage.objects;
DROP POLICY IF EXISTS "Public read review-photos"      ON storage.objects;
DROP POLICY IF EXISTS "Public can read review photos"  ON storage.objects;

CREATE POLICY "Public can read review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- Set bucket to non-public to disable directory listing
-- (individual files still readable via signed/public URLs)
UPDATE storage.buckets
  SET public = false
  WHERE id = 'review-photos';
