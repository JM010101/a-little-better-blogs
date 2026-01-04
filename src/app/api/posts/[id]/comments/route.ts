import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch comments without relations first
    const { data: comments, error: commentsError } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', id)
      .eq('approved', true)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      throw new Error(`Failed to fetch comments: ${commentsError.message}`)
    }

    // Fetch author profiles for comments that have author_id
    const authorIds = comments?.filter(c => c.author_id).map(c => c.author_id) || []
    let authorsMap = new Map()
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('blog_authors')
        .select('*')
        .in('user_id', authorIds)
      
      authors?.forEach(author => {
        authorsMap.set(author.user_id, author)
      })
    }

    // Attach authors to comments
    comments?.forEach(comment => {
      comment.author = comment.author_id ? authorsMap.get(comment.author_id) || null : null
    })

    // Get replies for each comment
    const commentIds = comments?.map(c => c.id) || []
    if (commentIds.length > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from('blog_comments')
        .select('*')
        .in('parent_id', commentIds)
        .eq('approved', true)
        .order('created_at', { ascending: true })

      if (repliesError) {
        console.error('Error fetching replies:', repliesError)
        throw new Error(`Failed to fetch replies: ${repliesError.message}`)
      }

      // Fetch author profiles for replies
      const replyAuthorIds = replies?.filter(r => r.author_id).map(r => r.author_id) || []
      if (replyAuthorIds.length > 0) {
        const { data: replyAuthors } = await supabase
          .from('blog_authors')
          .select('*')
          .in('user_id', replyAuthorIds)
        
        replyAuthors?.forEach(author => {
          authorsMap.set(author.user_id, author)
        })
      }

      // Attach authors to replies and organize by parent
      const repliesMap = new Map()
      replies?.forEach(reply => {
        reply.author = reply.author_id ? authorsMap.get(reply.author_id) || null : null
        const parentId = reply.parent_id
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, [])
        }
        repliesMap.get(parentId).push(reply)
      })

      comments?.forEach(comment => {
        comment.replies = repliesMap.get(comment.id) || []
      })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error: any) {
    console.error('GET /api/posts/[id]/comments error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch comments',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { content, parent_id, author_name, author_email } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // If not authenticated, require name and email
    if (!user && (!author_name || !author_email)) {
      return NextResponse.json(
        { error: 'Name and email are required for anonymous comments' },
        { status: 400 }
      )
    }

    const commentData: any = {
      post_id: id,
      content,
      parent_id: parent_id || null,
      approved: user ? true : false, // Auto-approve authenticated comments
    }

    if (user) {
      commentData.author_id = user.id
    } else {
      commentData.author_name = author_name
      commentData.author_email = author_email
    }

    const { data: comment, error: insertError } = await supabase
      .from('blog_comments')
      .insert(commentData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      throw new Error(`Failed to create comment: ${insertError.message}`)
    }

    // Fetch author profile if comment has author_id
    if (comment && comment.author_id) {
      const { data: author } = await supabase
        .from('blog_authors')
        .select('*')
        .eq('user_id', comment.author_id)
        .maybeSingle()
      
      comment.author = author || null
    } else {
      comment.author = null
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
