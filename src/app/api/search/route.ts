import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Use full-text search function for better results
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_posts_fulltext', {
        search_query: query.trim(),
        result_limit: limit,
      })

    // Fetch posts without relations first
    let posts: any[] = []
    
    if (searchError) {
      // Fallback to ILIKE if full-text search fails
      const { data: postsData, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      posts = postsData || []
    } else {
      if (!searchResults || searchResults.length === 0) {
        return NextResponse.json({ posts: [] })
      }

      // Get full post data for search results
      const postIds = searchResults.map((r: any) => r.id)
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .in('id', postIds)
        .eq('published', true)

      if (postsError) throw postsError

      // Sort posts by search rank
      const postsMap = new Map(postsData?.map((p: any) => [p.id, p]) || [])
      posts = searchResults
        .map((r: any) => postsMap.get(r.id))
        .filter(Boolean)
    }

    // Fetch relations separately
    if (posts.length > 0) {
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
      posts = posts.map(post => ({
        ...post,
        author: authorsMap.get(post.author_id) || null,
        categories: categoriesMap.get(post.id) || [],
        tags: tagsMap.get(post.id) || []
      }))
    }

    return NextResponse.json({ posts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
