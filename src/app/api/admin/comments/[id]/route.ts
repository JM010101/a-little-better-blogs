import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
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

    // TODO: Add admin role check here

    const body = await request.json()
    const { approved } = body

    const { data: comment, error } = await supabase
      .from('blog_comments')
      .update({ approved })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`)
    }

    return NextResponse.json({ comment })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
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

    // TODO: Add admin role check here

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

