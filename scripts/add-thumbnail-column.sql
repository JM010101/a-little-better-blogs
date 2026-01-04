



DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'blog_posts' 
    AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE blog_posts 
    ADD COLUMN thumbnail_url TEXT;
    
    
    CREATE INDEX IF NOT EXISTS idx_blog_posts_thumbnail_url 
    ON blog_posts(thumbnail_url) 
    WHERE thumbnail_url IS NOT NULL;
    
    RAISE NOTICE 'Column thumbnail_url added successfully';
  ELSE
    RAISE NOTICE 'Column thumbnail_url already exists';
  END IF;
END $$;

