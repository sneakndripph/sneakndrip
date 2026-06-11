-- Fix storage policy for client-side uploads by admin users
-- The original policy checked auth.jwt() ->> 'role' which returns the DB role
-- ('authenticated'), not the custom user_metadata role ('admin').
-- This migration corrects the check and ensures the bucket exists.

-- Ensure product-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old (broken) admin upload policy
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;

-- Allow authenticated admin users to insert product images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow admins to update (used by upsert/crop-replace)
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow admins to delete images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
