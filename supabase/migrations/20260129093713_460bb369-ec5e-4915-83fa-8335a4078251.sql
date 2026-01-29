-- Make driver-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'driver-photos';

-- Add RLS policy for authenticated users to view driver photos
CREATE POLICY "Authenticated users can view driver photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-photos');