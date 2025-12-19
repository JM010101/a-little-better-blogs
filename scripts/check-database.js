const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database setup...\n')

  // Check if tables exist
  const tables = [
    'blog_posts',
    'blog_categories',
    'blog_tags',
    'blog_post_categories',
    'blog_post_tags',
    'blog_comments',
    'blog_ratings',
    'blog_authors'
  ]

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table "${table}" does not exist`)
      } else if (error.code === '42501') {
        console.log(`⚠️  Table "${table}" exists but RLS is blocking access`)
      } else {
        console.log(`❌ Table "${table}" error:`, error.message)
      }
    } else {
      console.log(`✅ Table "${table}" exists and is accessible`)
    }
  }

  // Check blog_posts count
  console.log('\n📊 Checking blog_posts...')
  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select('id, title, published', { count: 'exact' })

  if (postsError) {
    console.log('❌ Error fetching posts:', postsError.message)
  } else {
    console.log(`✅ Found ${posts?.length || 0} posts (total count: ${posts?.length || 0})`)
    if (posts && posts.length > 0) {
      console.log('Sample posts:')
      posts.slice(0, 3).forEach(post => {
        console.log(`  - ${post.title} (published: ${post.published})`)
      })
    } else {
      console.log('⚠️  No posts found. You may want to create some test data.')
    }
  }

  // Check categories
  console.log('\n📊 Checking blog_categories...')
  const { data: categories, error: categoriesError } = await supabase
    .from('blog_categories')
    .select('*')

  if (categoriesError) {
    console.log('❌ Error fetching categories:', categoriesError.message)
  } else {
    console.log(`✅ Found ${categories?.length || 0} categories`)
  }

  // Check tags
  console.log('\n📊 Checking blog_tags...')
  const { data: tags, error: tagsError } = await supabase
    .from('blog_tags')
    .select('*')

  if (tagsError) {
    console.log('❌ Error fetching tags:', tagsError.message)
  } else {
    console.log(`✅ Found ${tags?.length || 0} tags`)
  }

  console.log('\n✨ Database check complete!')
}

checkDatabase().catch(console.error)
