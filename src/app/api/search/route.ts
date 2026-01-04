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

    if (searchError) {
      // Fallback to ILIKE if full-text search fails
      const { data: posts, error } = await supabase
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
        .limit(limit)

      if (error) throw error
      return NextResponse.json({ posts: posts || [] })
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // Get full post data for search results
    const postIds = searchResults.map((r: any) => r.id)
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:blog_authors(*),
        categories:blog_post_categories(blog_categories(*)),
        tags:blog_post_tags(blog_tags(*))
      `)
      .in('id', postIds)
      .eq('published', true)

    if (postsError) throw postsError

    // Sort posts by search rank
    const postsMap = new Map(posts?.map((p: any) => [p.id, p]) || [])
    const sortedPosts = searchResults
      .map((r: any) => postsMap.get(r.id))
      .filter(Boolean)

    return NextResponse.json({ posts: sortedPosts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
