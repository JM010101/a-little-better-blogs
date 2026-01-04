-- Migration: Add INSERT policies for blog_categories and blog_tags
-- Run this in your Supabase SQL Editor

-- Allow authenticated users to create categories
DROP POLICY IF EXISTS "Authenticated users can create categories" ON blog_categories;
CREATE POLICY "Authenticated users can create categories"
ON blog_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to create tags
DROP POLICY IF EXISTS "Authenticated users can create tags" ON blog_tags;
CREATE POLICY "Authenticated users can create tags"
ON blog_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Optional: Allow authenticated users to update categories (for admin use)
DROP POLICY IF EXISTS "Authenticated users can update categories" ON blog_categories;
CREATE POLICY "Authenticated users can update categories"
ON blog_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Optional: Allow authenticated users to update tags (for admin use)
DROP POLICY IF EXISTS "Authenticated users can update tags" ON blog_tags;
CREATE POLICY "Authenticated users can update tags"
ON blog_tags
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

