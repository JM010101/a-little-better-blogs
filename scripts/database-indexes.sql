


CREATE INDEX IF NOT EXISTS idx_blog_posts_title_fts ON blog_posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_fts ON blog_posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_blog_posts_excerpt_fts ON blog_posts USING gin(to_tsvector('english', COALESCE(excerpt, '')));


CREATE INDEX IF NOT EXISTS idx_blog_posts_published_featured ON blog_posts(published, featured) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at_desc ON blog_posts(published_at DESC) WHERE published = true AND published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_published ON blog_posts(author_id, published, published_at DESC) WHERE published = true;


CREATE INDEX IF NOT EXISTS idx_blog_posts_views_desc ON blog_posts(views DESC) WHERE published = true;


CREATE INDEX IF NOT EXISTS idx_blog_posts_reading_time ON blog_posts(reading_time);


CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category_id ON blog_post_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);


CREATE INDEX IF NOT EXISTS idx_blog_comments_post_approved ON blog_comments(post_id, approved, created_at DESC) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_approved ON blog_comments(parent_id, approved) WHERE parent_id IS NOT NULL AND approved = true;


CREATE INDEX IF NOT EXISTS idx_blog_ratings_post_rating ON blog_ratings(post_id, rating);
CREATE INDEX IF NOT EXISTS idx_blog_ratings_user_post ON blog_ratings(user_id, post_id);


CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING gin(
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(content, '') || ' ' || 
    COALESCE(excerpt, '')
  )
) WHERE published = true;




CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_at ON blog_posts(updated_at DESC);


CREATE INDEX IF NOT EXISTS idx_blog_authors_user_id ON blog_authors(user_id);

