import { Suspense } from 'react'
import { PostCard } from '@/components/blog/PostCard'
import { SearchBar } from '@/components/blog/SearchBar'

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function fetchPostsWithRelations(posts: any[], supabase: any) {
  if (!posts || posts.length === 0) return []
  
  const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean)))
  const postIds = posts.map(p => p.id)
  
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
  
  return posts.map(post => ({
    ...post,
    author: authorsMap.get(post.author_id) || null,
    categories: categoriesMap.get(post.id) || [],
    tags: tagsMap.get(post.id) || []
  }))
}

async function SearchResults({ query }: { query: string }) {
  const { createServerSupabaseClient } = await import('@/lib/supabase')
  const supabase = await createServerSupabaseClient()
  
  // Fetch posts without relations first
  const { data: postsData } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(20)

  // Fetch relations
  const posts = await fetchPostsWithRelations(postsData || [], supabase)

  return (
    <>
      {posts && posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No posts found matching "{query}".</p>
        </div>
      )}
    </>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Search</h1>
        <div className="mb-8">
          <SearchBar initialValue={query} />
        </div>

        {query && (
          <Suspense fallback={<div className="text-gray-600">Searching...</div>}>
            <SearchResults query={query} />
          </Suspense>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Enter a search term to find posts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
