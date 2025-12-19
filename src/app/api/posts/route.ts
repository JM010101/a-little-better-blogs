import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { slugify, calculateReadingTime } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const author = searchParams.get('author')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:blog_authors(*),
        categories:blog_post_categories(blog_categories(*)),
        tags:blog_post_tags(blog_tags(*))
      `, { count: 'exact' })
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.contains('categories', [{ slug: category }])
    }

    if (tag) {
      query = query.contains('tags', [{ slug: tag }])
    }

    if (author) {
      query = query.eq('author_id', author)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Get ratings for posts
    const postIds = data?.map(p => p.id) || []
    if (postIds.length > 0) {
      const { data: ratings } = await supabase
        .from('blog_ratings')
        .select('post_id, rating')
        .in('post_id', postIds)

      const ratingsMap = new Map<string, { sum: number; count: number }>()
      ratings?.forEach(r => {
        const existing = ratingsMap.get(r.post_id) || { sum: 0, count: 0 }
        ratingsMap.set(r.post_id, {
          sum: existing.sum + r.rating,
          count: existing.count + 1
        })
      })

      data?.forEach(post => {
        const ratingData = ratingsMap.get(post.id)
        if (ratingData) {
          post.average_rating = ratingData.sum / ratingData.count
          post.rating_count = ratingData.count
        }
      })
    }

    return NextResponse.json({
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, excerpt, categories, tags, featured, published } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const slug = slugify(title)
    const readingTime = calculateReadingTime(content)

    // Check if slug exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    let finalSlug = slug
    if (existingPost) {
      finalSlug = `${slug}-${Date.now()}`
    }

    const postData: any = {
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || null,
      author_id: user.id,
      featured: featured || false,
      published: published || false,
      reading_time: readingTime,
      published_at: published ? new Date().toISOString() : null,
    }

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()

    if (postError) throw postError

    // Handle categories
    if (categories && categories.length > 0) {
      const categoryIds = await Promise.all(
        categories.map(async (catName: string) => {
          const catSlug = slugify(catName)
          // Check if category exists
          let { data: category } = await supabase
            .from('blog_categories')
            .select('id')
            .eq('slug', catSlug)
            .single()

          if (!category) {
            const { data: newCategory } = await supabase
              .from('blog_categories')
              .insert({ name: catName, slug: catSlug })
              .select()
              .single()
            category = newCategory
          }

          return category?.id
        })
      )

      await supabase
        .from('blog_post_categories')
        .insert(
          categoryIds.filter(Boolean).map(catId => ({
            post_id: post.id,
            category_id: catId
          }))
        )
    }

    // Handle tags
    if (tags && tags.length > 0) {
      const tagIds = await Promise.all(
        tags.map(async (tagName: string) => {
          const tagSlug = slugify(tagName)
          // Check if tag exists
          let { data: tag } = await supabase
            .from('blog_tags')
            .select('id')
            .eq('slug', tagSlug)
            .single()

          if (!tag) {
            const { data: newTag } = await supabase
              .from('blog_tags')
              .insert({ name: tagName, slug: tagSlug })
              .select()
              .single()
            tag = newTag
          }

          return tag?.id
        })
      )

      await supabase
        .from('blog_post_tags')
        .insert(
          tagIds.filter(Boolean).map(tagId => ({
            post_id: post.id,
            tag_id: tagId
          }))
        )
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
