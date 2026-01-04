import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Try to fetch the post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published, author_id, created_at')
      .eq('slug', slug)
      .single()
    
    return NextResponse.json({
      slug,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message,
      post: post || null,
      postError: postError ? {
        code: postError.code,
        message: postError.message,
        details: postError.details,
        hint: postError.hint
      } : null,
      canView: post ? (
        post.published || (user && post.author_id === user.id)
      ) : false
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

