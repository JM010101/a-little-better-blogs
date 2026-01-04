
DROP POLICY IF EXISTS "Authors can read their own posts" ON blog_posts;
CREATE POLICY "Authors can read their own posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (author_id = auth.uid());

