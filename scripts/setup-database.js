const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('Please add:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTables() {
  console.log('🏗️  Setting up A Little Better Blog database...')
  
  try {
    // Test connection first
    const { error: connectionTest } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1)

    if (connectionTest) {
      console.log('📋 Creating database tables...')
      console.log('')
      console.log('⚠️  Please run this SQL in your Supabase SQL Editor:')
      console.log('')
      console.log(`
-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    featured BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    reading_time INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Post Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_categories (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- Blog Post Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    author_email TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Ratings Table
CREATE TABLE IF NOT EXISTS blog_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Blog Authors Table (Profile Extension)
CREATE TABLE IF NOT EXISTS blog_authors (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(approved);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_ratings_post_id ON blog_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_ratings_user_id ON blog_ratings(user_id);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
CREATE POLICY "Public can read published posts" ON blog_posts
    FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON blog_posts;
CREATE POLICY "Authenticated users can create posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own posts" ON blog_posts;
CREATE POLICY "Users can update their own posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON blog_posts;
CREATE POLICY "Users can delete their own posts" ON blog_posts
    FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for blog_categories
DROP POLICY IF EXISTS "Public can read categories" ON blog_categories;
CREATE POLICY "Public can read categories" ON blog_categories
    FOR SELECT USING (true);

-- RLS Policies for blog_tags
DROP POLICY IF EXISTS "Public can read tags" ON blog_tags;
CREATE POLICY "Public can read tags" ON blog_tags
    FOR SELECT USING (true);

-- RLS Policies for blog_post_categories
DROP POLICY IF EXISTS "Public can read post categories" ON blog_post_categories;
CREATE POLICY "Public can read post categories" ON blog_post_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage post categories" ON blog_post_categories;
CREATE POLICY "Authenticated users can manage post categories" ON blog_post_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_categories.post_id
            AND blog_posts.author_id = auth.uid()
        )
    );

-- RLS Policies for blog_post_tags
DROP POLICY IF EXISTS "Public can read post tags" ON blog_post_tags;
CREATE POLICY "Public can read post tags" ON blog_post_tags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage post tags" ON blog_post_tags;
CREATE POLICY "Authenticated users can manage post tags" ON blog_post_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM blog_posts
            WHERE blog_posts.id = blog_post_tags.post_id
            AND blog_posts.author_id = auth.uid()
        )
    );

-- RLS Policies for blog_comments
DROP POLICY IF EXISTS "Public can read approved comments" ON blog_comments;
CREATE POLICY "Public can read approved comments" ON blog_comments
    FOR SELECT USING (approved = true OR author_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create comments" ON blog_comments;
CREATE POLICY "Anyone can create comments" ON blog_comments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own comments" ON blog_comments;
CREATE POLICY "Users can update their own comments" ON blog_comments
    FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON blog_comments;
CREATE POLICY "Users can delete their own comments" ON blog_comments
    FOR DELETE USING (author_id = auth.uid());

-- RLS Policies for blog_ratings
DROP POLICY IF EXISTS "Public can read ratings" ON blog_ratings;
CREATE POLICY "Public can read ratings" ON blog_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create ratings" ON blog_ratings;
CREATE POLICY "Authenticated users can create ratings" ON blog_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON blog_ratings;
CREATE POLICY "Users can update their own ratings" ON blog_ratings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON blog_ratings;
CREATE POLICY "Users can delete their own ratings" ON blog_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_authors
DROP POLICY IF EXISTS "Public can read author profiles" ON blog_authors;
CREATE POLICY "Public can read author profiles" ON blog_authors
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own author profile" ON blog_authors;
CREATE POLICY "Users can create their own author profile" ON blog_authors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own author profile" ON blog_authors;
CREATE POLICY "Users can update their own author profile" ON blog_authors
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_ratings_updated_at ON blog_ratings;
CREATE TRIGGER update_blog_ratings_updated_at
    BEFORE UPDATE ON blog_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_authors_updated_at ON blog_authors;
CREATE TRIGGER update_blog_authors_updated_at
    BEFORE UPDATE ON blog_authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log('')
      console.log('Then run: npm run setup')
    } else {
      console.log('✅ Database tables already exist!')
      console.log('🎉 Your blog database is ready!')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupTables()
