-- Add photo_url to return_requests for customer proof photos
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for return photos (public so admin can view via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-photos', 'return-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload return photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Auth users can upload return photos'
  ) THEN
    CREATE POLICY "Auth users can upload return photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'return-photos');
  END IF;
END $$;
