


CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_views INTEGER;
BEGIN
  UPDATE blog_posts
  SET views = views + 1
  WHERE id = post_id
  RETURNING views INTO new_views;
  
  RETURN COALESCE(new_views, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_post_stats(post_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'views', COALESCE(views, 0),
    'average_rating', (
      SELECT COALESCE(AVG(rating), 0)
      FROM blog_ratings
      WHERE blog_ratings.post_id = get_post_stats.post_id
    ),
    'rating_count', (
      SELECT COUNT(*)
      FROM blog_ratings
      WHERE blog_ratings.post_id = get_post_stats.post_id
    ),
    'comment_count', (
      SELECT COUNT(*)
      FROM blog_comments
      WHERE blog_comments.post_id = get_post_stats.post_id
      AND blog_comments.approved = true
    )
  ) INTO stats
  FROM blog_posts
  WHERE id = post_id;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION search_posts_fulltext(search_query TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID,
  views INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.excerpt,
    p.published_at,
    p.author_id,
    p.views,
    ts_rank(
      to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '') || ' ' || COALESCE(p.excerpt, '')),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM blog_posts p
  WHERE p.published = true
    AND (
      to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '') || ' ' || COALESCE(p.excerpt, ''))
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY rank DESC, p.published_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_related_posts(post_id UUID, result_limit INT DEFAULT 3)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER
) AS $$
DECLARE
  post_categories UUID[];
  post_tags UUID[];
BEGIN
  
  SELECT ARRAY_AGG(category_id) INTO post_categories
  FROM blog_post_categories
  WHERE post_id = get_related_posts.post_id;
  
  SELECT ARRAY_AGG(tag_id) INTO post_tags
  FROM blog_post_tags
  WHERE post_id = get_related_posts.post_id;
  
  RETURN QUERY
  SELECT DISTINCT p.id, p.title, p.slug, p.excerpt, p.published_at, p.views
  FROM blog_posts p
  WHERE p.published = true
    AND p.id != get_related_posts.post_id
    AND (
      EXISTS (
        SELECT 1
        FROM blog_post_categories pc
        WHERE pc.post_id = p.id
        AND pc.category_id = ANY(post_categories)
      )
      OR EXISTS (
        SELECT 1
        FROM blog_post_tags pt
        WHERE pt.post_id = p.id
        AND pt.tag_id = ANY(post_tags)
      )
    )
  ORDER BY p.published_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_post_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_posts_fulltext(TEXT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_related_posts(UUID, INT) TO authenticated, anon;

