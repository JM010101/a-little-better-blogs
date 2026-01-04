-- Storage Policies for blog-images bucket
-- Run this in Supabase SQL Editor after creating the bucket
-- Note: These policies work on the storage.objects table

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Policy 2: Allow users to delete their own files
-- Files are stored as: blog-images/{user_id}/{filename}
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow public read access (since bucket is public)
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Policy 4: Allow authenticated users to list their own files
CREATE POLICY "Users can list their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow authenticated users to update their own files
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

