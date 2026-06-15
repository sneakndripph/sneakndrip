-- Support multiple photos per return request
ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Migrate existing single photo_url into photo_urls array
UPDATE return_requests
SET photo_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL AND (photo_urls IS NULL OR photo_urls = '{}');
