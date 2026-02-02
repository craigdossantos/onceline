-- Add photo support to events
-- Migration: 20260202130000_event_photos.sql

-- Add image columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_metadata JSONB;

-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can manage their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Also allow public read for shared timelines (photos are public URLs)
CREATE POLICY "Public can view event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

COMMENT ON COLUMN events.image_url IS 'URL to the event photo in Supabase Storage';
COMMENT ON COLUMN events.image_metadata IS 'EXIF and other metadata extracted from the photo';
