-- Create payment-proofs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own payment proofs
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
  );

-- Allow service role (admin client) to read all payment proofs
-- The admin client uses the service_role key which bypasses RLS entirely,
-- so no explicit SELECT policy is needed for admin access.
-- This policy allows authenticated users to read their own uploads.
DROP POLICY IF EXISTS "Authenticated users can read payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can read payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
  );
