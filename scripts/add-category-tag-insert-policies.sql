



DROP POLICY IF EXISTS "Authenticated users can create categories" ON blog_categories;
CREATE POLICY "Authenticated users can create categories"
ON blog_categories
FOR INSERT
TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated users can create tags" ON blog_tags;
CREATE POLICY "Authenticated users can create tags"
ON blog_tags
FOR INSERT
TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated users can update categories" ON blog_categories;
CREATE POLICY "Authenticated users can update categories"
ON blog_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated users can update tags" ON blog_tags;
CREATE POLICY "Authenticated users can update tags"
ON blog_tags
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

