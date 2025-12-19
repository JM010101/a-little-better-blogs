import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        author:blog_authors(*)
      `)
      .eq('post_id', params.id)
      .eq('approved', true)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Get replies for each comment
    const commentIds = comments?.map(c => c.id) || []
    if (commentIds.length > 0) {
      const { data: replies } = await supabase
        .from('blog_comments')
        .select(`
          *,
          author:blog_authors(*)
        `)
        .in('parent_id', commentIds)
        .eq('approved', true)
        .order('created_at', { ascending: true })

      // Organize replies by parent
      const repliesMap = new Map()
      replies?.forEach(reply => {
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
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      post_id: params.id,
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

    const { data: comment, error } = await supabase
      .from('blog_comments')
      .insert(commentData)
      .select(`
        *,
        author:blog_authors(*)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
