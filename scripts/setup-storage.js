const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.log('⚠️  You need the service role key to create storage buckets.')
  console.log('   You can find it in: Supabase Dashboard → Settings → API → service_role key')
  console.log('')
  console.log('📋 Please create the bucket manually:')
  console.log('   1. Go to Supabase Dashboard → Storage')
  console.log('   2. Click "New bucket"')
  console.log('   3. Name: blog-images')
  console.log('   4. Public: Yes')
  console.log('   5. Then run the SQL policies from setup-storage-policies.sql')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🏗️  Setting up Supabase Storage for blog images...')
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }

    const bucketExists = buckets?.some(b => b.id === 'blog-images')

    if (bucketExists) {
      console.log('✅ Bucket "blog-images" already exists!')
    } else {
      // Create bucket
      const { data: bucket, error: createError } = await supabase.storage.createBucket('blog-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      })

      if (createError) {
        throw createError
      }

      console.log('✅ Created bucket "blog-images"')
    }

    console.log('')
    console.log('📋 Storage policies need to be set up manually:')
    console.log('   1. Go to Supabase Dashboard → Storage → Policies')
    console.log('   2. Select the "blog-images" bucket')
    console.log('   3. Run the SQL from scripts/setup-storage-policies.sql')
    console.log('')
    console.log('   OR use the Supabase Dashboard UI to create policies:')
    console.log('   - Allow authenticated users to INSERT')
    console.log('   - Allow authenticated users to DELETE their own files')
    console.log('   - Allow public to SELECT (read)')
    console.log('   - Allow authenticated users to SELECT their own files')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('')
    console.log('📋 Please create the bucket manually:')
    console.log('   1. Go to Supabase Dashboard → Storage')
    console.log('   2. Click "New bucket"')
    console.log('   3. Name: blog-images')
    console.log('   4. Public: Yes')
  }
}

setupStorage()

