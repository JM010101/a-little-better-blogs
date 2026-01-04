-- NOTE: Direct INSERT into storage.buckets requires superuser permissions
-- It's better to create the bucket through:
-- 1. Supabase Dashboard → Storage → New bucket (recommended)
-- 2. Or use the setup-storage.js script with service role key
--
-- This SQL file is kept for reference but may not work without proper permissions.
-- Use setup-storage-policies.sql for policies after creating the bucket manually.

-- If you have superuser access, you can try:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'blog-images',
--   'blog-images',
--   true,
--   5242880, 
--   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET 
--   public = true,
--   file_size_limit = 5242880,
--   allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];


DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');



DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');


DROP POLICY IF EXISTS "Users can list their own images" ON storage.objects;
CREATE POLICY "Users can list their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

