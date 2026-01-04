# Supabase Storage Setup

## Creating the Storage Bucket

To enable image uploads, you need to create a storage bucket in your Supabase project.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://app.supabase.com
   - Select your project

2. **Open Storage**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Name: `blog-images`
   - Public bucket: **Yes** (check this box)
   - File size limit: 5 MB (or your preferred limit)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif` (optional, for extra security)

4. **Set Up Storage Policies**

   After creating the bucket, you need to set up Row Level Security (RLS) policies. Go to Storage > Policies and add:

   **Policy 1: Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'blog-images');
   ```

   **Policy 2: Allow authenticated users to delete their own files**
   ```sql
   CREATE POLICY "Users can delete their own images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'blog-images' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 3: Allow public read access**
   ```sql
   CREATE POLICY "Public can read images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'blog-images');
   ```

   **Policy 4: Allow authenticated users to list their own files**
   ```sql
   CREATE POLICY "Users can list their own images"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'blog-images' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

### Alternative: Quick Setup via SQL

You can also run this SQL in the Supabase SQL Editor:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Allow authenticated users to list their own files
CREATE POLICY "Users can list their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Verify Setup

After creating the bucket and policies:
1. Try uploading an image through the blog editor
2. Check that the image appears correctly
3. Verify that images are publicly accessible via their URLs

### Troubleshooting

- **"Bucket not found" error**: Make sure the bucket name is exactly `blog-images` (case-sensitive)
- **"Permission denied" error**: Check that RLS policies are set up correctly
- **Images not loading**: Ensure the bucket is set to "Public" and the public read policy is active

