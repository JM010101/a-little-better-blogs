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

    // Start with filtering post IDs if category or tag filters are applied
    let postIds: string[] | null = null

    if (category) {
      const { data: categoryData } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle()
      
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
      } else {
        postIds = [] // Category doesn't exist
      }
    }

    if (tag && (postIds === null || postIds.length > 0)) {
      const { data: tagData } = await supabase
        .from('blog_tags')
        .select('id')
        .eq('slug', tag)
        .maybeSingle()
      
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
      } else {
        postIds = [] // Tag doesn't exist
      }
    }

    // Return early if no posts match filters
    if (postIds !== null && postIds.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    // Build the main query
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:blog_authors(*),
        categories:blog_post_categories(blog_categories(*)),
        tags:blog_post_tags(blog_tags(*))
      `, { count: 'exact' })
      .eq('published', true)

    // Apply post ID filter if we have filtered IDs
    if (postIds !== null && postIds.length > 0) {
      query = query.in('id', postIds)
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

    // Apply ordering and pagination
    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get ratings for posts
    const fetchedPostIds = data?.map(p => p.id) || []
    if (fetchedPostIds.length > 0) {
      const { data: ratings } = await supabase
        .from('blog_ratings')
        .select('post_id, rating')
        .in('post_id', fetchedPostIds)

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
    const { title, content, excerpt, categories, tags, featured, published, thumbnail_url } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const slug = slugify(title)
    const readingTime = calculateReadingTime(content)

    // Check if slug exists and generate unique slug if needed
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    let finalSlug = slug
    if (existingPost) {
      // Use UUID-based suffix for better uniqueness under concurrency
      const uuid = crypto.randomUUID().split('-')[0]
      finalSlug = `${slug}-${uuid}`
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

    // Add thumbnail_url if provided (only if column exists in database)
    // Note: If you get an error about unknown column, run the migration script
    if (thumbnail_url && thumbnail_url.trim()) {
      postData.thumbnail_url = thumbnail_url.trim()
    }

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()

    if (postError) {
      console.error('Post creation error:', postError)
      throw new Error(`Failed to create post: ${postError.message}`)
    }

    // Handle categories
    if (categories && categories.length > 0) {
      const categoryIds = await Promise.all(
        categories.map(async (catName: string) => {
          const catSlug = slugify(catName)
          // Check if category exists
          let { data: category, error: categoryError } = await supabase
            .from('blog_categories')
            .select('id')
            .eq('slug', catSlug)
            .maybeSingle()

          if (categoryError) {
            throw new Error(`Failed to fetch category: ${categoryError.message}`)
          }

          if (!category) {
            const { data: newCategory, error: insertError } = await supabase
              .from('blog_categories')
              .insert({ name: catName, slug: catSlug })
              .select()
              .single()
            
            if (insertError) {
              throw new Error(`Failed to create category: ${insertError.message}`)
            }
            category = newCategory
          }

          return category?.id
        })
      )

      const { error: insertCategoriesError } = await supabase
        .from('blog_post_categories')
        .insert(
          categoryIds.filter(Boolean).map(catId => ({
            post_id: post.id,
            category_id: catId
          }))
        )

      if (insertCategoriesError) {
        throw new Error(`Failed to insert categories: ${insertCategoriesError.message}`)
      }
    }

    // Handle tags
    if (tags && tags.length > 0) {
      const tagIds = await Promise.all(
        tags.map(async (tagName: string) => {
          const tagSlug = slugify(tagName)
          // Check if tag exists
          let { data: tag, error: tagError } = await supabase
            .from('blog_tags')
            .select('id')
            .eq('slug', tagSlug)
            .maybeSingle()

          if (tagError) {
            throw new Error(`Failed to fetch tag: ${tagError.message}`)
          }

          if (!tag) {
            const { data: newTag, error: insertError } = await supabase
              .from('blog_tags')
              .insert({ name: tagName, slug: tagSlug })
              .select()
              .single()
            
            if (insertError) {
              throw new Error(`Failed to create tag: ${insertError.message}`)
            }
            tag = newTag
          }

          return tag?.id
        })
      )

      const { error: insertTagsError } = await supabase
        .from('blog_post_tags')
        .insert(
          tagIds.filter(Boolean).map(tagId => ({
            post_id: post.id,
            tag_id: tagId
          }))
        )

      if (insertTagsError) {
        throw new Error(`Failed to insert tags: ${insertTagsError.message}`)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create post',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
