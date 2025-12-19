import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calculateReadingTime, slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:blog_authors(*),
        categories:blog_post_categories(blog_categories(*)),
        tags:blog_post_tags(blog_tags(*))
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Only show published posts unless user is the author
    if (!post.published && post.author_id !== user?.id) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment views
    await supabase
      .from('blog_posts')
      .update({ views: post.views + 1 })
      .eq('id', id)

    // Get ratings
    const { data: ratings } = await supabase
      .from('blog_ratings')
      .select('rating, user_id')
      .eq('post_id', id)

    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
      post.average_rating = sum / ratings.length
      post.rating_count = ratings.length
      
      if (user) {
        const userRating = ratings.find(r => r.user_id === user.id)
        post.user_rating = userRating?.rating
      }
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns the post
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('author_id, published_at')
      .eq('id', id)
      .single()

    if (!existingPost || existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, excerpt, categories, tags, featured, published } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (title) updateData.title = title
    if (content) {
      updateData.content = content
      updateData.reading_time = calculateReadingTime(content)
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (featured !== undefined) updateData.featured = featured
    if (published !== undefined) {
      updateData.published = published
      if (published && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update categories if provided
    if (categories) {
      await supabase
        .from('blog_post_categories')
        .delete()
        .eq('post_id', id)

      if (categories.length > 0) {
        const categoryIds = await Promise.all(
          categories.map(async (catName: string) => {
            const catSlug = slugify(catName)
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
              post_id: id,
              category_id: catId
            }))
          )
      }
    }

    // Update tags if provided
    if (tags) {
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id)

      if (tags.length > 0) {
        const tagIds = await Promise.all(
          tags.map(async (tagName: string) => {
            const tagSlug = slugify(tagName)
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
              post_id: id,
              tag_id: tagId
            }))
          )
      }
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user owns the post
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!existingPost || existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

