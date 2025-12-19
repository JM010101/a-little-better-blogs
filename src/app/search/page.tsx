import { Suspense } from 'react'
import { PostCard } from '@/components/blog/PostCard'
import { SearchBar } from '@/components/blog/SearchBar'

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function SearchResults({ query }: { query: string }) {
  const { createServerSupabaseClient } = await import('@/lib/supabase')
  const supabase = await createServerSupabaseClient()
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('published', true)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(20)

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
