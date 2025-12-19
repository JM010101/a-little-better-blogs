import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'
import Link from 'next/link'

interface PostsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams
  
  const category = typeof params.category === 'string' ? params.category : undefined
  const tag = typeof params.tag === 'string' ? params.tag : undefined
  const author = typeof params.author === 'string' ? params.author : undefined
  const featured = typeof params.featured === 'string' ? params.featured === 'true' : undefined
  const search = typeof params.search === 'string' ? params.search : undefined
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const limit = 12
  const offset = (page - 1) * limit

  try {
    // Start with a simple query to get post IDs if filters are applied
    let postIds: string[] | null = null

    if (category) {
      const { data: categoryData } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (categoryData) {
        const { data: postCategories } = await supabase
          .from('blog_post_categories')
          .select('post_id')
          .eq('category_id', categoryData.id)
        
        if (postCategories && postCategories.length > 0) {
          postIds = postCategories.map(pc => pc.post_id)
        } else {
          postIds = [] // Empty array means no results
        }
      }
    }

    if (tag && (postIds === null || postIds.length > 0)) {
      const { data: tagData } = await supabase
        .from('blog_tags')
        .select('id')
        .eq('slug', tag)
        .single()
      
      if (tagData) {
        const { data: postTags } = await supabase
          .from('blog_post_tags')
          .select('post_id')
          .eq('tag_id', tagData.id)
        
        if (postTags && postTags.length > 0) {
          const tagPostIds = postTags.map(pt => pt.post_id)
          if (postIds) {
            // Intersect the arrays
            postIds = postIds.filter(id => tagPostIds.includes(id))
          } else {
            postIds = tagPostIds
          }
        } else {
          postIds = [] // Empty array means no results
        }
      }
    }

    // Return early if no posts match filters
    if (postIds !== null && postIds.length === 0) {
      return (
        <div className="container-custom py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">All Posts</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts found.</p>
          </div>
        </div>
      )
    }

    // Build the main query - start simple without joins
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('published', true)

    // Apply post ID filter if we have filtered IDs
    if (postIds !== null && postIds.length > 0) {
      query = query.in('id', postIds)
    }

    // Apply other filters
    if (author) {
      query = query.eq('author_id', author)
    }

    if (featured) {
      query = query.eq('featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Apply ordering and pagination
    const { data: posts, error, count } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error: error,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
      throw error
    }

    // If we have posts, fetch related data
    let postsWithRelations = posts || []
    
    if (posts && posts.length > 0) {
      // Fetch author data
      const authorIds = [...new Set(posts.map(p => p.author_id))]
      const { data: authors } = await supabase
        .from('blog_authors')
        .select('*')
        .in('user_id', authorIds)

      const authorsMap = new Map(authors?.map(a => [a.user_id, a]) || [])

      // Fetch categories for each post
      const postIdsForCategories = posts.map(p => p.id)
      const { data: postCategories } = await supabase
        .from('blog_post_categories')
        .select(`
          post_id,
          blog_categories(*)
        `)
        .in('post_id', postIdsForCategories)

      // Fetch tags for each post
      const { data: postTags } = await supabase
        .from('blog_post_tags')
        .select(`
          post_id,
          blog_tags(*)
        `)
        .in('post_id', postIdsForCategories)

      // Organize categories and tags by post
      const categoriesMap = new Map<string, any[]>()
      const tagsMap = new Map<string, any[]>()

      postCategories?.forEach((pc: any) => {
        if (!categoriesMap.has(pc.post_id)) {
          categoriesMap.set(pc.post_id, [])
        }
        if (pc.blog_categories) {
          categoriesMap.get(pc.post_id)?.push(pc.blog_categories)
        }
      })

      postTags?.forEach((pt: any) => {
        if (!tagsMap.has(pt.post_id)) {
          tagsMap.set(pt.post_id, [])
        }
        if (pt.blog_tags) {
          tagsMap.get(pt.post_id)?.push(pt.blog_tags)
        }
      })

      // Combine everything
      postsWithRelations = posts.map(post => ({
        ...post,
        author: authorsMap.get(post.author_id) || null,
        categories: categoriesMap.get(post.id) || [],
        tags: tagsMap.get(post.id) || []
      }))
    }

    const pagination = {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }

    // Build URL params for pagination links
    const urlParams = new URLSearchParams()
    if (category) urlParams.set('category', category)
    if (tag) urlParams.set('tag', tag)
    if (author) urlParams.set('author', author)
    if (featured) urlParams.set('featured', 'true')
    if (search) urlParams.set('search', search)

    return (
      <div className="container-custom py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Posts</h1>
          {search && (
            <p className="text-gray-600">
              Search results for: <strong>{search}</strong>
            </p>
          )}
        </div>

        {postsWithRelations && postsWithRelations.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {postsWithRelations.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/posts?${new URLSearchParams({ ...Object.fromEntries(urlParams), page: (page - 1).toString() }).toString()}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>
                {page < pagination.totalPages && (
                  <Link
                    href={`/posts?${new URLSearchParams({ ...Object.fromEntries(urlParams), page: (page + 1).toString() }).toString()}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts found.</p>
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    console.error('Error in PostsPage:', error)
    console.error('Error type:', typeof error)
    console.error('Error keys:', Object.keys(error || {}))
    console.error('Full error:', JSON.stringify(error, null, 2))
    
    return (
      <div className="container-custom py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Posts</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Error loading posts. Please try again later.</p>
          <p className="text-sm text-gray-500 mt-2">
            {error?.message || error?.details || String(error) || 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }
}
