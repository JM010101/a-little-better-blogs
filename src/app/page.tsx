import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'

async function fetchPostsWithRelations(posts: any[], supabase: any) {
  if (!posts || posts.length === 0) return []
  
  const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
  const postIds = posts.map(p => p.id)
  
  // Fetch all relations in parallel
  const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
    authorIds.length > 0
      ? supabase.from('blog_authors').select('*').in('user_id', authorIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('blog_post_categories')
      .select('post_id, blog_categories(*)')
      .in('post_id', postIds),
    supabase
      .from('blog_post_tags')
      .select('post_id, blog_tags(*)')
      .in('post_id', postIds)
  ])
  
  // Create maps for quick lookup
  const authorsMap = new Map()
  authorsResult.data?.forEach((author: any) => {
    authorsMap.set(author.user_id, author)
  })
  
  const categoriesMap = new Map()
  categoriesResult.data?.forEach((item: any) => {
    if (!categoriesMap.has(item.post_id)) {
      categoriesMap.set(item.post_id, [])
    }
    if (item.blog_categories) {
      categoriesMap.get(item.post_id).push(item.blog_categories)
    }
  })
  
  const tagsMap = new Map()
  tagsResult.data?.forEach((item: any) => {
    if (!tagsMap.has(item.post_id)) {
      tagsMap.set(item.post_id, [])
    }
    if (item.blog_tags) {
      tagsMap.get(item.post_id).push(item.blog_tags)
    }
  })
  
  // Attach relations to posts
  return posts.map(post => ({
    ...post,
    author: authorsMap.get(post.author_id) || null,
    categories: categoriesMap.get(post.id) || [],
    tags: tagsMap.get(post.id) || []
  }))
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  
  // Fetch posts without relations first
  const { data: featuredPostsData, error: featuredError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const { data: recentPostsData, error: recentError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(6)

  if (featuredError) {
    console.error('Error fetching featured posts:', featuredError)
  }
  if (recentError) {
    console.error('Error fetching recent posts:', recentError)
  }

  // Fetch relations for both sets
  const featuredPosts = await fetchPostsWithRelations(featuredPostsData || [], supabase)
  const recentPosts = await fetchPostsWithRelations(recentPostsData || [], supabase)

  return (
    <div className="container-custom py-12">
      {featuredPosts && featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Posts</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post: any) => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Latest Posts</h2>
          <Link href="/posts" className="text-primary-600 hover:underline font-semibold">
            View All →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
