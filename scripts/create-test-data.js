const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('   Optional (recommended): SUPABASE_SERVICE_ROLE_KEY')
    console.error('   Will use anon key (may fail due to RLS)')
  }
  process.exit(1)
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createTestData() {
  console.log('📝 Creating test data...\n')

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Using service role key (bypasses RLS)\n')
  } else {
    console.log('⚠️  Using anon key (may fail due to RLS policies)\n')
  }

  // Get an existing user or create a test user
  console.log('Finding or creating test user...')
  let authorId

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // With service role, we can query auth.users directly
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('⚠️  Could not list users:', usersError.message)
    }

    if (users && users.users && users.users.length > 0) {
      authorId = users.users[0].id
      console.log(`✅ Using existing user: ${users.users[0].email || authorId}`)
    } else {
      // Create a test user
      const testEmail = `test-${Date.now()}@example.com`
      const testPassword = 'TestPassword123!'
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })

      if (createUserError) {
        console.log('❌ Could not create test user:', createUserError.message)
        console.log('\n💡 Solution: Create a user manually via Supabase Auth or your app')
        console.log('   Then run this script again, or use SQL to insert posts with a real user_id')
        return
      } else {
        authorId = newUser.user.id
        console.log(`✅ Created test user: ${testEmail}`)
        console.log(`   Password: ${testPassword}`)
      }
    }
  } else {
    // Without service role, we can't create users
    console.log('⚠️  Cannot create users without service role key')
    console.log('   Please sign up via your app first, or add SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  // Create a test category
  console.log('\nCreating test category...')
  let category
  const { data: existingCategory } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', 'technology')
    .single()

  if (existingCategory) {
    console.log('✅ Category already exists')
    category = existingCategory
  } else {
    const { data: newCategory, error: catError } = await supabase
      .from('blog_categories')
      .insert({
        name: 'Technology',
        slug: 'technology',
        description: 'Posts about technology and software'
      })
      .select()
      .single()

    if (catError) {
      console.log('❌ Error creating category:', catError.message)
      if (catError.code === '42501') {
        console.log('   💡 Tip: Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS')
      }
    } else {
      console.log('✅ Category created')
      category = newCategory
    }
  }

  // Create a test tag
  console.log('Creating test tag...')
  let tag
  const { data: existingTag } = await supabase
    .from('blog_tags')
    .select('*')
    .eq('slug', 'nextjs')
    .single()

  if (existingTag) {
    console.log('✅ Tag already exists')
    tag = existingTag
  } else {
    const { data: newTag, error: tagError } = await supabase
      .from('blog_tags')
      .insert({
        name: 'Next.js',
        slug: 'nextjs'
      })
      .select()
      .single()

    if (tagError) {
      console.log('❌ Error creating tag:', tagError.message)
      if (tagError.code === '42501') {
        console.log('   💡 Tip: Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS')
      }
    } else {
      console.log('✅ Tag created')
      tag = newTag
    }
  }

  // Create a test post
  console.log('\nCreating test post...')
  const { data: existingPost } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', 'welcome-to-a-little-better-blog')
    .single()

  if (existingPost) {
    console.log('✅ Post already exists')
    console.log('\n✨ Test data already exists!')
    return
  }

  const testPost = {
    title: 'Welcome to A Little Better Blog',
    slug: 'welcome-to-a-little-better-blog',
    content: `# Welcome to A Little Better Blog

This is your first blog post! You can edit or delete this post.

## Features

- **Markdown Support**: Write your posts in Markdown
- **Categories & Tags**: Organize your content
- **Comments**: Engage with your readers
- **Ratings**: Let readers rate your posts

## Getting Started

1. Create your first post
2. Add categories and tags
3. Share with your audience!

Happy blogging! 🎉`,
    excerpt: 'Welcome to your new blog! Learn how to get started.',
    author_id: authorId,
    published: true,
    featured: true,
    reading_time: 2,
    published_at: new Date().toISOString()
  }

  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .insert(testPost)
    .select()
    .single()

  if (postError) {
    if (postError.code === '23505') {
      console.log('⚠️  Post already exists (slug conflict)')
    } else if (postError.code === '42501') {
      console.log('❌ Error creating post: RLS policy violation')
      console.log('   💡 Tip: Add SUPABASE_SERVICE_ROLE_KEY to .env.local')
      console.log('   Or sign in via the web app and create posts there')
      return
    } else {
      console.log('❌ Error creating post:', postError.message)
      console.log('   Details:', postError.details)
      console.log('   Hint:', postError.hint)
      return
    }
  } else {
    console.log('✅ Test post created!')
    
    // Link category if it exists
    if (category) {
      const { error: linkCatError } = await supabase
        .from('blog_post_categories')
        .insert({
          post_id: post.id,
          category_id: category.id
        })
      
      if (!linkCatError) {
        console.log('✅ Category linked to post')
      } else {
        console.log('⚠️  Could not link category:', linkCatError.message)
      }
    }

    // Link tag if it exists
    if (tag) {
      const { error: linkTagError } = await supabase
        .from('blog_post_tags')
        .insert({
          post_id: post.id,
          tag_id: tag.id
        })
      
      if (!linkTagError) {
        console.log('✅ Tag linked to post')
      } else {
        console.log('⚠️  Could not link tag:', linkTagError.message)
      }
    }
  }

  console.log('\n✨ Test data creation complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Visit http://localhost:3000/posts to see your posts')
  console.log('   2. Create more posts via the /create page')
  console.log('   3. Sign in to create posts with your own account')
}

createTestData().catch(console.error)
