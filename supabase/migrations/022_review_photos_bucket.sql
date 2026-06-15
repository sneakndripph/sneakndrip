-- Public bucket for customer review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone (authenticated or anon) can upload their own review photo
CREATE POLICY "Public can upload review photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'review-photos');

-- Public read
CREATE POLICY "Public can view review photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-photos');
